import {
  generatePresignedUploadUrl,
  deleteObject,
  objectExists,
  getObjectMetadata,
} from "@dating-app/shared";
const allowed_extension = ["jpg", "jpeg", "png", "webp"];
const allowed_mime_types = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export function generateMediaRoutes(app) {
  // we user first ask backend permission that we need to store the images
  // we just receive a presigned url we didnt send image till now
  app.post(
    "/media/photos/presign",
    { preHandler: app.authenticate, config: { authenticated: true, rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { fileExtension } = request.body ?? {};
      const normalizedExtension = String(fileExtension || '').toLowerCase();
      if (!allowed_extension.includes(normalizedExtension)) {
        return reply
          .code(400)
          .send({
            error: "File Extension must be one of them : jpg,png,jpeg,webp",
          });
      }

      const { key, uploadUrl, publicUrl } = await generatePresignedUploadUrl({
        userId: request.userId,
        fileExtension: normalizedExtension,
        folder: "profile-photos",
      });

      // nowclient use this upload url to upload in s3 ,further when succeed status received we store it in database
      return reply.send({ uploadUrl, key, publicUrl });
    },
  );

  // -----------------------------------------------------------------------
  // STEP 2: Client confirms the upload finished - NOW we save the DB row.
  // We trust the client's "it succeeded" here for MVP simplicity; a more
  // hardened version would verify the object actually exists in the bucket
  // (a HeadObjectCommand call) before saving the row.
  // -----------------------------------------------------------------------
  app.post(
    "/media/photos/confirm",
    { preHandler: app.authenticate, config: { authenticated: true, rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { publicUrl, key, isPrimary } = request.body ?? {};
      if (!key || !publicUrl) {
        return reply.code(400).send({ error: "key and PublicUrl is required" });
      }

      // storing ur image metadata in db first require to check whether profile of user exist
      const profile = await app.db.profile.findUnique({
        where: { userId: request.userId },
      });

      if (!profile) {
        return reply
          .code(404)
          .send({ error: "Create your profile before uploading photos" });
      }

      //check whether the object exist in s3 or not if not then we dont store it in db
      const exists = await objectExists(key);
      if (!exists) {
        return reply.code(400).send({ error: "Image not found in S3" });
      }

      // Validate file size and content type before storing metadata
      const metadata = await getObjectMetadata(key);
      if (metadata) {
        if (metadata.ContentLength > MAX_FILE_SIZE_BYTES) {
          await deleteObject(key);
          return reply.code(400).send({ error: "File exceeds maximum allowed size of 10MB" });
        }
        if (metadata.ContentType && !allowed_mime_types.includes(metadata.ContentType.toLowerCase())) {
          await deleteObject(key);
          return reply.code(400).send({ error: "Invalid file type. Only images are allowed" });
        }
      }

      // if a user gave a img to make that image a primary image we update that image to primary by revoking old primary image
      if (isPrimary) {
        await app.db.photo.updateMany({
          where: { profileId: profile.id, isPrimary: true },
          // make it to false
          data: { isPrimary: false },
        });
      }
      const existingCount = await app.db.photo.count({
        where: { profileId: profile.id },
      });
      const photo = await app.db.photo.create({
        data: {
          profileId: profile.id,
          url: publicUrl,
          position: existingCount,
          isPrimary: Boolean(isPrimary) || existingCount === 0, //first photo is primary by default
        },
      });

      return reply.code(201).send(photo);
    },
  );

  // Q1. When uploading multiple photos, is /confirm called once or multiple times?
  // Answer: In our implementation, /confirm is called once per successfully uploaded photo, creating one database record for each image.

  // Q2. How do you retrieve all photos if you only have one publicUrl?
  // Answer: Each uploaded photo gets its own unique publicUrl, and the database stores one row per photo. To fetch all photos, we query all Photo records for that user's profile.

  // Q3. Why do we need the confirm endpoint?
  // Answer: It saves the photo metadata in the database only after the frontend confirms that the S3 upload succeeded.

  // Q4. What is isPrimary?
  // Answer: isPrimary identifies the user's main profile photo, ensuring only one photo is displayed as the default profile picture.

  /* upload a selfie in s3 */
  app.post(
    "/media/selfie/presign",
    { preHandler: app.authenticate, config: { authenticated: true, rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, res) => {
      const { fileExtension } = req.body ?? {};
      if (!fileExtension || !allowed_extension.includes(fileExtension)) {
        return reply
          .code(400)
          .send({
            error:
              'Please fileExtension must be of any one of these: "jpg , jpeg , png , webp"',
          });
      }
      const { key, uploadUrl } = await generatePresignedUploadUrl({
        userId: req.userId,
        fileExtension: fileExtension.toLowerCase(),
        folder:
          "selfies" /* seperate private folder.. we never generate public url for this */,
      });

      return res.send({ ok: true, uploadUrl, key });
    },
  );

  app.delete(
    "/media/photos/:photoId",
    { preHandler: app.authenticate, config: { authenticated: true, rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { photoId } = request.params;

      const photo = await app.db.photo.findUnique({
        where: {
          id: photoId,
        },
        include: { profile: true },
      });
      if (!photo || photo.profile.userId !== request.userId) {
        return reply
          .code(404)
          .send({
            error:
              "Photo not found | You are not eligible to delete some others photo",
          });
      }

      await app.db.photo.delete({ where: { id: photoId } });
      await deleteObject(photo.key).catch((err) => {
        request.log.error(
          err,
          "Failed to delete S3 Object - DB row is gone regardless",
        );
      });

      //if the user maked the primary photo as delete
      if (photo.isPrimary) {
        //select photos who have these profile id and whichever u get first make it as primary
        const next = await app.db.photo.findFirst({
          where: {
            profileId: photo.profileId,
          },
          orderBy: { order: "asc" },
        });
        if (next) {
          await app.db.photo.update({
            where: {
              id: next.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }

        return reply.send({ ok: true });
      }
    },
  );

  app.put(
    "/media/photos/:photoId/primary",
    { preHandler: app.authenticate, config: { authenticated: true } },
    async (request, reply) => {
      // photoid is the id which user needs to make primary
      const { photoId } = request.params;

      // Fix: use app.db.photo.findUnique (not app.db.findUnique)
      const photo = await app.db.photo.findUnique({
        where: {
          id: photoId,
        },
        include: { profile: true },
      });
      if (!photo || photo.profile.userId !== request.userId) {
        return reply.code(404).send({ error: "Photo not found" });
      }

      const currentStatus = photo.profile.verificationStatus;

      // Handle verification status changes when primary photo is updated
      if (currentStatus === 'VERIFIED') {
        // User was fully verified - changing primary photo requires re-verification
        await app.db.profile.update({
          where: { id: photo.profileId },
          data: { verificationStatus: 'REVERIFICATION_REQUIRED' },
        });
      } else if (currentStatus === 'UNDER_REVIEW') {
        // User has a verification in progress - cancel the pending request
        // since the comparison photo has changed
        await app.db.verificationRequest.updateMany({
          where: {
            userId: request.userId,
            status: 'UNDER_REVIEW',
          },
          data: {
            status: 'REJECTED',
            rejectionReason: 'Primary photo changed during review - new verification required',
            reviewedAt: new Date(),
          },
        });
        // Update profile to PENDING so user can submit new verification
        await app.db.profile.update({
          where: { id: photo.profileId },
          data: { verificationStatus: 'PENDING' },
        });
      }
      // For PENDING, REJECTED, REVERIFICATION_REQUIRED - no status change needed

      // Remove the old primary photo and make it false
      await app.db.photo.updateMany({
        where: {
          profileId: photo.profileId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
      // Update the new photo as primary
      await app.db.photo.update({
        where: {
          id: photoId,
        },
        data: {
          isPrimary: true,
        },
      });
      return reply.send({ ok: true });
    },
  );
}
