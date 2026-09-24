// AWS SDK is not available in test environment
// These types are stubs to allow compilation
class SESClient {
  constructor(config: any) {}
  async send(command: any): Promise<any> {
    throw new Error('SESClient not available');
  }
}

class SendEmailCommand {
  constructor(params: any) {}
}

class GetAccountSendingEnabledStatusCommand {
  constructor(params: any) {}
}

interface SendReminderEmailInput {
  recipientEmail: string;
  reporterName: string;
  deadline: string;
}

interface SendReminderEmailOutput {
  messageId: string;
  status: "sent" | "failed";
  timestamp: string;
}

interface SendNonSubmissionAlertInput {
  recipientEmails: string[];
  reportDate: string;
}

interface SendNonSubmissionAlertOutput {
  successCount: number;
  failureCount: number;
  failedEmails: string[];
  timestamp: string;
}

interface GetDeliveryStatusInput {
  messageId: string;
}

interface GetDeliveryStatusOutput {
  messageId: string;
  status: "delivered" | "bounced" | "complained" | "failed" | "unknown";
  timestamp: string;
}

interface EmailNotificationService {
  sendReminderEmail(input: SendReminderEmailInput): Promise<SendReminderEmailOutput>;
  sendNonSubmissionAlert(input: SendNonSubmissionAlertInput): Promise<SendNonSubmissionAlertOutput>;
  getDeliveryStatus(input: GetDeliveryStatusInput): Promise<GetDeliveryStatusOutput>;
}

interface AmazonSESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromEmail: string;
  maxSendRate: number;
}

function validateEnvironmentVariables(): AmazonSESConfig {
  const requiredVars = [
    "AWS_SES_REGION",
    "AWS_SES_ACCESS_KEY_ID",
    "AWS_SES_SECRET_ACCESS_KEY",
    "AWS_SES_FROM_EMAIL",
    "AWS_SES_MAX_SEND_RATE",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  return {
    region: process.env.AWS_SES_REGION!,
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
    fromEmail: process.env.AWS_SES_FROM_EMAIL!,
    maxSendRate: parseInt(process.env.AWS_SES_MAX_SEND_RATE!, 10),
  };
}

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

function createAmazonSESAdapter(config: AmazonSESConfig): EmailNotificationService {
  const sesClient = new SESClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const sendEmail = async (toEmail: string, subject: string, htmlBody: string): Promise<string> => {
    return retryWithExponentialBackoff(async () => {
      const command = new SendEmailCommand({
        Source: config.fromEmail,
        Destination: {
          ToAddresses: [toEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: "UTF-8",
            },
          },
        },
      });

      const response = await sesClient.send(command);

      if (!response.MessageId) {
        throw new Error("No MessageId returned from SES");
      }

      return response.MessageId;
    });
  };

  return {
    async sendReminderEmail(input: SendReminderEmailInput): Promise<SendReminderEmailOutput> {
      const subject = "日報入力期限のお知らせ";
      const htmlBody = `
        <html>
          <body>
            <p>${input.reporterName}様</p>
            <p>日報の入力期限が近づいています。</p>
            <p>期限: ${input.deadline}</p>
            <p>お手数ですが、期限までに日報をご提出ください。</p>
          </body>
        </html>
      `;

      try {
        const messageId = await sendEmail(input.recipientEmail, subject, htmlBody);
        return {
          messageId,
          status: "sent",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(
          `Failed to send reminder email to ${input.recipientEmail}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async sendNonSubmissionAlert(input: SendNonSubmissionAlertInput): Promise<SendNonSubmissionAlertOutput> {
      const subject = "日報未提出のお知らせ";
      const htmlBody = `
        <html>
          <body>
            <p>日報がまだ提出されていません。</p>
            <p>対象日: ${input.reportDate}</p>
            <p>至急ご提出ください。</p>
          </body>
        </html>
      `;

      let successCount = 0;
      const failedEmails: string[] = [];

      for (const email of input.recipientEmails) {
        try {
          await sendEmail(email, subject, htmlBody);
          successCount++;
        } catch (error) {
          failedEmails.push(email);
        }
      }

      if (failedEmails.length > 0) {
        throw new Error(`Failed to send alerts to ${failedEmails.length} recipients: ${failedEmails.join(", ")}`);
      }

      return {
        successCount,
        failureCount: failedEmails.length,
        failedEmails,
        timestamp: new Date().toISOString(),
      };
    },

    async getDeliveryStatus(input: GetDeliveryStatusInput): Promise<GetDeliveryStatusOutput> {
      try {
        const command = new GetAccountSendingEnabledStatusCommand({});
        await sesClient.send(command);

        return {
          messageId: input.messageId,
          status: "unknown",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(
          `Failed to get delivery status for message ${input.messageId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  };
}

export {
  EmailNotificationService,
  SendReminderEmailInput,
  SendReminderEmailOutput,
  SendNonSubmissionAlertInput,
  SendNonSubmissionAlertOutput,
  GetDeliveryStatusInput,
  GetDeliveryStatusOutput,
  AmazonSESConfig,
  createAmazonSESAdapter,
  validateEnvironmentVariables,
};
