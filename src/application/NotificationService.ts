import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { EmailService } from '../infrastructure/EmailService';
import { Notification } from '../domain/Notification';

export class NotificationService {
    private sqsClient: SQSClient;
    private queueUrl: string;
    private emailService: EmailService;

    constructor() {
        this.sqsClient = new SQSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                sessionToken: process.env.AWS_SESSION_TOKEN,
            },
        });
        this.queueUrl = process.env.AWS_SQS_QUEUE || 'NOTIFICATION_QUEUE';
        this.emailService = new EmailService();
    }

    public async start() {
        console.log('Notification Service started. Listening for messages...');
        while (true) {
            const messages = await this.receiveMessages();
            if (messages) {
                for (const message of messages) {
                    if (message.Body) {
                        const notification: Notification = JSON.parse(message.Body);
                        await this.emailService.sendNotification(notification);
                        await this.deleteMessage(message.ReceiptHandle!);
                    }
                }
            }
            await this.delay(5000);
        }
    }

    private async receiveMessages() {
        const params = {
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 10,
        };
        const command = new ReceiveMessageCommand(params);
        const response = await this.sqsClient.send(command);
        return response.Messages;
    }

    private async deleteMessage(receiptHandle: string) {
        const params = {
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
        };
        const command = new DeleteMessageCommand(params);
        await this.sqsClient.send(command);
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
