import { createRedisClient, QUEUE_NAMES, prisma, circuitBreaker } from '@dating-app/shared'
import { Worker } from 'bullmq'
import { Resend } from 'resend'

export function startMatchNotificationWorker(logger) {
    const connection = createRedisClient(logger, 'worker-match-notification');
    const breakerRedisConnection = createRedisClient(logger, 'worker-reis-match-notification')

    /* Creating resend client */
    const redis = new Resend(process.env.REDIS_API_KEY)

    const emailFrom = process.env.RESEND_MAIL_FROM ||
        'Melodis <onboarding@resend.dev>'

    const worker = new Worker(
        QUEUE_NAMES.MATCH_NOTIFICATION,
        async (job) => {

            const { matchId, userAId, userBId, userAEmail, userBEmail, userADisplayName, userBDisplayName } = job.data
            logger.info('Processing the match send notification in worker ')

            const log = logger.child({
                requestId
            })
            log.info(
                {
                    matchId,
                    jobId: job.id,
                    attempt: job.attemptsMade + 1
                },
                'Processing match notification job'
            );

            await circuitBreaker(
                breakerRedisConnection,
                'resend',
                async () => {

                    /* Sending email to user A */
                    const { data: emailA, error: errorA } = await resend.emails.send({
                        from: emailFrom,
                        to: [userAEmail],
                        subject: "It's a Match! 💕",
                        html: `
                                <div style="font-family: Arial, sans-serif;">
                                    <h1>It's a Match! 🎉</h1>

                                    <p>
                                        Hey ${userADisplayName || 'there'},
                                    </p>

                                    <p>
                                        You and
                                        <strong>
                                            ${userBDisplayName || 'someone'}
                                        </strong>
                                        liked each other!
                                    </p>

                                    <p>
                                        Open the Melodis.in and start chatting , and let the conversation begins seamlessly.
                                    </p>

                                    <p>
                                        ❤️ Melodis Team
                                    </p>
                                </div>
                            `
                    })

                    if(errorA){
                        throw new Error(`Failed to send Email to ${userADisplayName} where email is ${userAEmail} and error is ${errorA.message}`)
                    }
                    log.info(
                        {
                            matchId,
                            recipient: userAEmail,
                            emailId: emailA?.id
                        },
                        'Match email sent to User A'
                    );

                    /* Sending email to user B for a match */
                    const {data:userB, error:userBError} = await resend.send({
                        from:emailFrom,
                        to:[userBEmail],
                        subject: "It's a Match! 💕",
                            html: `
                                <div style="font-family: Arial, sans-serif;">
                                    <h1>It's a Match! 🎉</h1>

                                    <p>
                                        Hey ${userBDisplayName || 'there'},
                                    </p>

                                    <p>
                                        You and
                                        <strong>
                                            ${userADisplayName || 'someone'}
                                        </strong>
                                        liked each other!
                                    </p>

                                    <p>
                                        Open the Melodis.in and start chatting , and let the conversation begins seamlessly.
                                    </p>

                                    <p>
                                        ❤️ Dating App Team
                                    </p>
                                </div>
                            `
                    })

                    if (userBError) {
                        throw new Error(
                            `Failed to send email to User B: ${userBError.message}`
                        );
                    }

                    log.info(
                        {
                            matchId,
                            recipient: userBEmail,
                            emailId: emailB?.id
                        },
                        'Match email sent to User B'
                    );
                }
            )

            return { matchId, notifiedAt: new Date().toISOString() };
        },
        { connection, concurrency: 5 }
    )

    worker.on('completed', (job, result) => {

        logger.info(
            {
                jobId: job.id,
                result
            },
            'Match notification job completed'
        );
    });
    worker.on('failed', (job, err) => {

        logger.error(
            {
                jobId: job?.id,
                attempt: job?.attemptsMade,
                err: err.message
            },
            'Match notification job failed'
        );
    });

    return {breakerRedisConnection,connection,worker}
}



