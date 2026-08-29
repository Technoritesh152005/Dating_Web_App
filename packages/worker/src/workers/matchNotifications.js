import {
  createRedisClient,
  QUEUE_NAMES,
  prisma,
  circuitBreaker,
} from "@dating-app/shared";
import { Worker } from "bullmq";
import { Resend } from "resend";

export function startMatchNotificationWorker(logger) {
  const connection = createRedisClient(logger, "worker-match-notification");
  const breakerRedisConnection = createRedisClient(
    logger,
    "worker-reis-match-notification",
  );

  /* Creating resend client */
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailFrom =
    process.env.RESEND_MAIL_FROM || "Melodis <noreply@melodis.in>";

  const worker = new Worker(
    QUEUE_NAMES.MATCH_NOTIFICATION,
    async (job) => {
      const {
        matchId,
        userAId,
        userBId,
        userAEmail,
        userBEmail,
        userADisplayName,
        userBDisplayName,
      } = job.data;
      logger.info("Processing the match send notification in worker ");

      const log = logger.child({
        matchId,
      });
      log.info(
        {
          matchId,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
        },
        "Processing match notification job",
      );

      await circuitBreaker(breakerRedisConnection, "resend", async () => {
        /* Sending email to user A */
        const { data: emailA, error: errorA } = await resend.emails.send({
          from: emailFrom,
          to: [userAEmail],
          subject: "It's a Match! 💕",
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>It's a Match!</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #fff1f5;
    font-family: Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color: #fff1f5; padding: 40px 15px;">
    
    <tr>
        <td align="center">

            <!-- Main Card -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                style="
                    max-width: 600px;
                    width: 100%;
                    background-color: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 8px 30px rgba(236, 72, 153, 0.12);
                ">

                <!-- Header -->
                <tr>
                    <td align="center"
                        style="
                            padding: 38px 30px 25px;
                            background: linear-gradient(135deg, #ff4f81, #ec4899);
                            color: #ffffff;
                        ">

                        <div style="
                            font-size: 42px;
                            line-height: 1;
                            margin-bottom: 14px;
                        ">
                            💕
                        </div>

                        <h1 style="
                            margin: 0;
                            font-size: 34px;
                            line-height: 42px;
                            font-weight: 700;
                            color: #ffffff;
                        ">
                            It's a Match! 🎉
                        </h1>

                        <p style="
                            margin: 10px 0 0;
                            font-size: 15px;
                            color: #ffe4ec;
                        ">
                            Looks like the feeling is mutual.
                        </p>

                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding: 38px 40px 30px;">

                        <p style="
                            margin: 0 0 20px;
                            font-size: 18px;
                            line-height: 28px;
                            color: #333333;
                        ">
                            Hey <strong>${userADisplayName || "there"}</strong> 👋
                        </p>

                        <!-- Match Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                            style="
                                background-color: #fff5f8;
                                border: 1px solid #ffd6e2;
                                border-radius: 16px;
                            ">

                            <tr>
                                <td align="center" style="padding: 25px 20px;">

                                    <div style="
                                        font-size: 14px;
                                        color: #777777;
                                        margin-bottom: 10px;
                                    ">
                                        You and
                                    </div>

                                    <div style="
                                        font-size: 25px;
                                        font-weight: 700;
                                        color: #e91e63;
                                        margin-bottom: 10px;
                                    ">
                                        ${userBDisplayName || "someone"} 💗
                                    </div>

                                    <div style="
                                        font-size: 15px;
                                        line-height: 24px;
                                        color: #555555;
                                    ">
                                        liked each other.
                                    </div>

                                    <div style="
                                        margin-top: 15px;
                                        font-size: 28px;
                                    ">
                                        💕 ✨ 💕
                                    </div>

                                </td>
                            </tr>

                        </table>

                        <!-- Message -->
                        <p style="
                            margin: 28px 0 10px;
                            font-size: 16px;
                            line-height: 26px;
                            color: #444444;
                            text-align: center;
                        ">
                            Someone out there just became a little more interesting. 😉
                        </p>

                        <p style="
                            margin: 0 0 28px;
                            font-size: 15px;
                            line-height: 24px;
                            color: #777777;
                            text-align: center;
                        ">
                            Open Melodis and start the conversation.
                            Your next great conversation might be just one message away.
                        </p>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                                <td align="center"
                                    style="
                                        border-radius: 50px;
                                        background-color: #ec4899;
                                    ">

                                    <a href="https://melodis.in"
                                        style="
                                            display: inline-block;
                                            padding: 15px 34px;
                                            font-size: 16px;
                                            font-weight: 700;
                                            color: #ffffff;
                                            text-decoration: none;
                                            border-radius: 50px;
                                        ">
                                        💬 Start Chatting
                                    </a>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Divider -->
                <tr>
                    <td style="padding: 0 40px;">
                        <div style="
                            height: 1px;
                            background-color: #eeeeee;
                        "></div>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center"
                        style="padding: 25px 30px 32px;">

                        <div style="
                            font-size: 20px;
                            margin-bottom: 8px;
                        ">
                            💕
                        </div>

                        <p style="
                            margin: 0 0 6px;
                            font-size: 14px;
                            font-weight: 700;
                            color: #333333;
                        ">
                            Melodis Team
                        </p>

                        <p style="
                            margin: 0;
                            font-size: 12px;
                            color: #999999;
                        ">
                            Where meaningful connections begin.
                        </p>

                        <p style="
                            margin: 18px 0 0;
                            font-size: 11px;
                            color: #bbbbbb;
                        ">
                            You received this email because you have an account
                            on Melodis.in.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>

</table>

</body>
</html>
`,
        });

        if (errorA) {
          throw new Error(
            `Failed to send Email to ${userADisplayName} where email is ${userAEmail} and error is ${errorA.message}`,
          );
        }
        log.info(
          {
            matchId,
            recipient: userAEmail,
            emailId: emailA?.id,
          },
          "Match email sent to User A",
        );

        /* Sending email to user B for a match */
        const { data: emailB, error: userBError } = await resend.emails.send({
          from: emailFrom,
          to: [userBEmail],
          subject: "It's a Match! 💕",
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>It's a Match!</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #fff1f5;
    font-family: Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color: #fff1f5; padding: 40px 15px;">
    
    <tr>
        <td align="center">

            <!-- Main Card -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                style="
                    max-width: 600px;
                    width: 100%;
                    background-color: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 8px 30px rgba(236, 72, 153, 0.12);
                ">

                <!-- Header -->
                <tr>
                    <td align="center"
                        style="
                            padding: 38px 30px 25px;
                            background: linear-gradient(135deg, #ff4f81, #ec4899);
                            color: #ffffff;
                        ">

                        <div style="
                            font-size: 42px;
                            line-height: 1;
                            margin-bottom: 14px;
                        ">
                            💕
                        </div>

                        <h1 style="
                            margin: 0;
                            font-size: 34px;
                            line-height: 42px;
                            font-weight: 700;
                            color: #ffffff;
                        ">
                            It's a Match! 🎉
                        </h1>

                        <p style="
                            margin: 10px 0 0;
                            font-size: 15px;
                            color: #ffe4ec;
                        ">
                            Looks like the feeling is mutual.
                        </p>

                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding: 38px 40px 30px;">

                        <p style="
                            margin: 0 0 20px;
                            font-size: 18px;
                            line-height: 28px;
                            color: #333333;
                        ">
                            Hey <strong>${userADisplayName || "there"}</strong> 👋
                        </p>

                        <!-- Match Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                            style="
                                background-color: #fff5f8;
                                border: 1px solid #ffd6e2;
                                border-radius: 16px;
                            ">

                            <tr>
                                <td align="center" style="padding: 25px 20px;">

                                    <div style="
                                        font-size: 14px;
                                        color: #777777;
                                        margin-bottom: 10px;
                                    ">
                                        You and
                                    </div>

                                    <div style="
                                        font-size: 25px;
                                        font-weight: 700;
                                        color: #e91e63;
                                        margin-bottom: 10px;
                                    ">
                                        ${userBDisplayName || "someone"} 💗
                                    </div>

                                    <div style="
                                        font-size: 15px;
                                        line-height: 24px;
                                        color: #555555;
                                    ">
                                        liked each other.
                                    </div>

                                    <div style="
                                        margin-top: 15px;
                                        font-size: 28px;
                                    ">
                                        💕 ✨ 💕
                                    </div>

                                </td>
                            </tr>

                        </table>

                        <!-- Message -->
                        <p style="
                            margin: 28px 0 10px;
                            font-size: 16px;
                            line-height: 26px;
                            color: #444444;
                            text-align: center;
                        ">
                            Someone out there just became a little more interesting. 😉
                        </p>

                        <p style="
                            margin: 0 0 28px;
                            font-size: 15px;
                            line-height: 24px;
                            color: #777777;
                            text-align: center;
                        ">
                            Open Melodis and start the conversation.
                            Your next great conversation might be just one message away.
                        </p>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                                <td align="center"
                                    style="
                                        border-radius: 50px;
                                        background-color: #ec4899;
                                    ">

                                    <a href="https://melodis.in"
                                        style="
                                            display: inline-block;
                                            padding: 15px 34px;
                                            font-size: 16px;
                                            font-weight: 700;
                                            color: #ffffff;
                                            text-decoration: none;
                                            border-radius: 50px;
                                        ">
                                        💬 Start Chatting
                                    </a>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Divider -->
                <tr>
                    <td style="padding: 0 40px;">
                        <div style="
                            height: 1px;
                            background-color: #eeeeee;
                        "></div>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center"
                        style="padding: 25px 30px 32px;">

                        <div style="
                            font-size: 20px;
                            margin-bottom: 8px;
                        ">
                            💕
                        </div>

                        <p style="
                            margin: 0 0 6px;
                            font-size: 14px;
                            font-weight: 700;
                            color: #333333;
                        ">
                            Melodis Team
                        </p>

                        <p style="
                            margin: 0;
                            font-size: 12px;
                            color: #999999;
                        ">
                            Where meaningful connections begin.
                        </p>

                        <p style="
                            margin: 18px 0 0;
                            font-size: 11px;
                            color: #bbbbbb;
                        ">
                            You received this email because you have an account
                            on Melodis.in.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>

</table>

</body>
</html>
`,
        });

        if (userBError) {
          throw new Error(
            `Failed to send email to User B: ${userBError.message}`,
          );
        }

        log.info(
          {
            matchId,
            recipient: userBEmail,
            emailId: emailB?.id,
          },
          "Match email sent to User B",
        );
      });

      return { matchId, notifiedAt: new Date().toISOString() };
    },
    { connection, concurrency: 5 },
  );

  worker.on("completed", (job, result) => {
    logger.info(
      {
        jobId: job.id,
        result,
      },
      "Match notification job completed",
    );
  });
  worker.on("failed", (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      "Match notification job failed",
    );
  });

  return { breakerRedisConnection, connection, worker };
}
