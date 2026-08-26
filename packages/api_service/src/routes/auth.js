import { comparePassword, hashPassword } from "../utils/password.js";
import {
  signAccessToken,
  hashToken,
  generateRefreshToken,
} from "../utils/token.js";
import { OAuth2Client } from "google-auth-library";
import {
  isValidEmail,
  sanitizePhone,
} from "../plugins/validation_middleware.js";
import { createQueue } from "@dating-app/shared/src/queue.js";
import { QUEUE_NAMES } from "@dating-app/shared/src/queueNames.js";

// Configuration setting for access token and refresh token to be stored in cookies
const accessCookieOpts = (config) => ({
  httpOnly: true,
  secure: config.nodeEnv === "production", // this tells to use https only when production
  sameSite:
    "lax" /* Same site prevent to share http config to other web apps */,
  // The realtime service is on a sibling subdomain and must receive this cookie.
  ...(config.nodeEnv === "production" ? { domain: ".melodis.in" } : {}),
  path: "/",
  maxAge: 30 * 60, //same as access token
});

const refreshCookiesOpts = (config) => ({
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "strict",
  // Scoped to ONLY the refresh endpoint - the browser won't even attach this
  // cookie to other requests, shrinking the attack surface if anything on
  // another route were ever compromised.
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60,
});

export function registerAuthRoutes(app, config) {
  // GET /auth/me - returns current user's profile including verification status
  app.get(
    "/auth/me",
    { preHandler: app.authenticate, config: { authenticated: true } },
    async (request, reply) => {
      const user = await app.db.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          googleId: true,
          createdAt: true,
          profile: {
            select: {
              id: true,
              displayName: true,
              dateOfBirth: true,
              gender: true,
              bio: true,
              interests: true,
              profession: true,
              religion: true,
              caste: true,
              showReligionCaste: true,
              latitude: true,
              longitude: true,
              verificationStatus: true,
              safetyFlagged: true,
              photos: {
                where: { isPrimary: true },
                take: 1,
                select: { id: true, url: true, key: true, isPrimary: true },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      return reply.send(user);
    },
  );

  /* 1. SignUp Routes */
  app.post(
    "/auth/signup",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { email, password, phone } = request.body ?? {};

      if (!email || !password) {
        return reply.code(400).send({
          error: "Email and password are required",
        });
      }

      if (!isValidEmail(email)) {
        return reply.code(400).send({
          error: "Invalid email format",
        });
      }

      if (password.length < 8) {
        return reply.code(400).send({
          error: "Password cannot be less than 8 characters",
        });
      }
      if (phone) {
        const sanitizedPhone = sanitizePhone(phone);
        if (!sanitizedPhone || sanitizedPhone.length !== 10) {
          return reply
            .code(400)
            .send({ error: "Phone number must be 10 digits" });
        }
      }

      // app.db came from decorate as prisma client is created of schema it provides multiple methods
      const existinguser = await app.db.user.findUnique({ where: { email } });

      if (existinguser) {
        return reply
          .code(409)
          .send({ error: "An Account already exist with this credentials" });
      }
      const passwordHash = await hashPassword(password);
      const user = await app.db.user.create({
        data: {
          email,
          passwordHash,
          phone,
        },
      });

      await issueTokenPair(app, reply, config, user.id);

      return reply.code(201).send({ id: user.id, email: user.email });
    },
  );

  //google based login / signup
  app.post(
    "/auth/google/callback",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { idToken } = request.body ?? {};
      if (!idToken)
        return reply
          .code(400)
          .send({ error: "idToken is required for Google sign in" });

      if (!config.googleClientId)
        return reply
          .code(503)
          .send({ error: "Google Sign-in is not configured with server" });

      const client = new OAuth2Client(config.googleClientId);

      let payload;
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: config.googleClientId,
        });
        payload = ticket.getPayload();
      } catch (err) {
        return reply.code(401).send({ error: "Invalid Google token" });
      }

      if (!payload.email_verified) {
        return reply
          .code(401)
          .send({ error: "Google account email is not verified" });
      }

      const { sub: googleId, email, name } = payload;

      let user = await app.db.user.findUnique({
        where: {
          googleId,
        },
      });
      // no google account sign in linked... now check whether pass - email acc exist in our system
      if (!user) {
        const existingEmail = await app.db.user.findUnique({
          where: {
            email,
          },
        });

        // if u got the user with system with pass account and then u update users google id with this id as user tried to sign with google sign-in
        if (existingEmail)
          user = await app.db.user.update({
            where: { id: existingEmail.id },
            data: { googleId },
          });
        // else u didnt find pass acc also u create the account only (new))
        else user = await app.db.user.create({ data: { googleId, email } });
      }

      if (user.deletedAt) {
        return reply.code(410).send({
          error: "This account is scheduled for deletion",
        });
      }

      await issueTokenPair(app, reply, config, user.id);
      return reply.send({ id: user.id, email: user.email, name });
    },
  );
  /* login through email and password */
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { email, password } = request.body ?? {};

      if (!email || !password) {
        return reply
          .code(400)
          .send({ error: "Email and Password are required" });
      }

      if (!isValidEmail(email)) {
        return reply.code(400).send({ error: "Invalid email format" });
      }

      const user = await app.db.user.findUnique({ where: { email } });

      if (!user) {
        return reply.code(400).send({ error: "Invalid email or password" });
      }
      if (user.deletedAt) {
        return reply
          .code(410)
          .send({ error: "This account is scheduled for deletion" });
      }

      /* If u didnt get the user hash password means users once login using hashpassword and now ur trying with pass, eo tell them to login with google sign-in instead */
      if (!user.passwordHash)
        return reply
          .code(401)
          .send({
            error:
              "This acc uses Google-sign in options. Please use that instead",
          });
      const passwordvalid = await comparePassword(password, user.passwordHash);
      if (!passwordvalid) {
        return reply.code(400).send({ error: "Invalid Email or password" });
      }

      await issueTokenPair(app, reply, config, user.id);

      return reply.send({ id: user.id, email: user.email });
    },
  );

  app.post(
    "/auth/refresh",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const rawRefresh = request.cookies?.refreshToken;
      if (!rawRefresh) {
        return reply.code(401).send("Refresh Token is not provided");
      }

      const hashRefresh = hashToken(rawRefresh);
      const stored = await app.db.refreshTokens.findUnique({
        where: { tokenHash: hashRefresh },
      });

      if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
        return reply
          .code(401)
          .send({ error: "Refresh Token invalid or expired" });
      }

      const user = await app.db.user.findUnique({
        where: { id: stored.userId },
        select: { deletedAt: true },
      });

      if (!user || user.deletedAt) {
        return reply.code(410).send({
          error: "This account is scheduled for deletion.",
        });
      }

      await app.db.refreshTokens.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });

      await issueTokenPair(app, reply, config, stored.userId);

      return reply.send({ ok: true });
    },
  );

  app.post(
    "/auth/logout",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const rawRefresh = request.cookies?.refreshToken;
      if (rawRefresh) {
        const tokenHash = hashToken(rawRefresh);
        await app.db.refreshTokens.updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      // remove both token from cookies
      reply.clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
      });
      reply.clearCookie("refreshToken", {
        path: "/auth",
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "strict",
      });

      return reply.send({ ok: true });
    },
  );

  app.delete(
    "/account",
    {
      preHandler: app.authenticate,
      config: {
        authenticated: true,
        rateLimit: { max: 3, timeWindow: "1 hour" },
      },
    },
    async (request, reply) => {
      const deleteAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const result = await app.db.user.updateMany({
        where: {
          id: request.userId,
          deletedAt: null,
        },
          data: {
          deletedAt: new Date(),
          deleteAfter,
        },
      });

      // update returns count which state how many counts or rows where affected
      if (result.count === 0) {
        return reply.code(404).send({
          error: "Account not found or already schedule for deletion",
        });
      }

      //delete the cache stored of profile , feed and bloom filter seen
      await app.redis.del(`cache:profile::me:${request.userId}`);
      await app.redis.del(`feed:${request.userId}`);
      await app.redis.del(`seen:${request.userId}`);

      //the delete queue runs after 30days
      const queue = createQueue(
        QUEUE_NAMES.ACCOUNT_PURGE,
        app.redis.duplicate(),
      );

      await queue.add(
        "account-purge-deletion",
        { userId: request.userId },
        {
          delay: 30 * 24 * 60 * 60 * 1000,
          jobId: `account-purge-${request.userId}`,
        },
      );

      await app.db.refreshTokens.updateMany({
        where: {
          userId: request.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      reply.clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
      });

      reply.clearCookie("refreshToken", {
        path: "/auth",
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "strict",
      });

      return reply.send({
        ok: true,
        message: "Your Account is scheduled for its permanent deletion",
        deleteAfter,
      });
    },
  );
}

// shared by signup + login + refresh where it creates 1 acesstoken and 1 refreshtoken
export async function issueTokenPair(app, reply, config, userId) {
  const accessToken = signAccessToken(userId, config.jwtSecret);
  const { raw, hash, expiresAt } = generateRefreshToken();

  await app.db.refreshTokens.create({
    data: { userId, tokenHash: hash, expiresAt },
  });

  // once u created set the tokens in cookies and send it with reply
  // reply represents the HTTP response that will be sent to the browser.

  reply.setCookie("accessToken", accessToken, accessCookieOpts(config));
  reply.setCookie("refreshToken", raw, refreshCookiesOpts(config));
}
