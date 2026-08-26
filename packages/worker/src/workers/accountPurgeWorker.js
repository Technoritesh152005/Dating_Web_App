import { Worker } from "bullmq";
import {
  QUEUE_NAMES,
  createRedisClient,
  prisma,
  deleteObject,
} from "@dating-app/shared";

export function startAccountPurgeWorker(logger) {
  const connection = createRedisClient(logger, "account-purge");

  const worker = new Worker(
    QUEUE_NAMES.ACCOUNT_PURGE,
    async (job) => {
      const { userId } = job.data;

      // /deleting the s3 object images from s3 so getting key of images
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          profile: {
            include: {
              photos: {
                select: { key: true },
              },
            },
          },
          verificationReqs: {
            select: { selfieKey: true },
          },
          sentMessages: {
            select: { attachmentKey: true },
          },
        },
      });

      if (!user) {
        return {
          deleted: false,
          reason: "user-not-found",
        };
      }

      if (!user.deletedAt || !user.deleteAfter) {
        return {
          deleted: false,
          reason:
            "Delete of this account was never scheduled- Cannot delete this account",
        };
      }

      if (user.deleteAfter > new Date()) {
        return {
          deleted: false,
          reason:
            "This account deletion was scheduled too early. Cannot perform the account purge operation",
        };
      }

      const allObjectKeys = [
        ...(user?.profile?.photos ?? []).map((photo) => photo.key),
        ...user.verificationReqs.map((request) => request.selfieKey),
        ...user.sentMessages
          .map((message) => message.attachmentKey)
          .filter(Boolean),
      ];

      for (const key of allObjectKeys) {
        await deleteObject(key);
      }

      await prisma.user.delete({
        where: {
          id: userId,
        },
      });

      const redis = createRedisClient(logger, "worker-account-purge-cache");

      await redis.del(
        `cache:profile::me:${userId}`,
        `feed:${userId}`,
        `seen:${userId}`,
      );

      await redis.quit();

      logger.info({ userId }, "Account permanently deleted");

      return {
        deleted: true,
        userId,
        deletedObjectCount: allObjectKeys.length,
      };
    },
    {
      connection,
      concurrency: 3,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Account purge failed");
  });

  return { worker, connection };
}
