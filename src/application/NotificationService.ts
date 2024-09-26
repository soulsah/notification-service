import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { EmailService } from '../infrastructure/EmailService';
import { Notification } from '../domain/Notification';

export class NotificationService {
    private sqsClient: SQSClient;
    private queueUrl: string;
    private emailService: EmailService;

    constructor(sqsClient?: SQSClient, emailService?: EmailService) {
        this.sqsClient = sqsClient || new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
        this.queueUrl = process.env.AWS_SQS_QUEUE || 'NOTIFICATION_QUEUE';
        this.emailService = emailService || new EmailService();
    }

    public async start() {
        console.log('Notification Service started. Listening for messages...');
        while (true) {
            await this.processMessages();
            await this.delay(5000); // Poll every 5 seconds
        }
    }

    public async processMessages() {
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
    }

    private async receiveMessages(): Promise<Message[] | undefined> {
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
