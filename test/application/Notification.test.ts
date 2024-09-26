import { NotificationService } from '../../src/application/NotificationService';
import { EmailService } from '../../src/infrastructure/EmailService';
import { Notification } from '../../src/domain/Notification';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

jest.mock('@aws-sdk/client-sqs');
jest.mock('../../src/infrastructure/EmailService');

describe('NotificationService', () => {
    let notificationService: NotificationService;
    let sqsClientMock: jest.Mocked<SQSClient>;
    let emailServiceMock: jest.Mocked<EmailService>;

    beforeEach(() => {
        sqsClientMock = new SQSClient({ region: 'us-east-1' }) as jest.Mocked<SQSClient>;
        emailServiceMock = new EmailService() as jest.Mocked<EmailService>;

        notificationService = new NotificationService(sqsClientMock, emailServiceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should process messages and send notifications', async () => {
        const messages = [
            {
                MessageId: '1',
                ReceiptHandle: 'handle1',
                Body: JSON.stringify({
                    nomeMedico: 'Dr. João',
                    emailMedico: 'dr.joao@example.com',
                    nomePaciente: 'Maria Silva',
                    dataAgendamento: '10-10-2024',
                }),
            },
        ];

        (sqsClientMock.send as jest.Mock).mockImplementation((command) => {
            if (command instanceof ReceiveMessageCommand) {
                return Promise.resolve({ Messages: messages });
            }
            if (command instanceof DeleteMessageCommand) {
                return Promise.resolve({});
            }
            return Promise.resolve({});
        });

        emailServiceMock.sendNotification.mockResolvedValueOnce();

        // Alterar o método start para permitir teste unitário
        await notificationService.processMessages();

        expect(emailServiceMock.sendNotification).toHaveBeenCalledTimes(1);
        expect(emailServiceMock.sendNotification).toHaveBeenCalledWith({
            nomeMedico: 'Dr. João',
            emailMedico: 'dr.joao@example.com',
            nomePaciente: 'Maria Silva',
            dataAgendamento: '10-10-2024',
        });

        expect(sqsClientMock.send).toHaveBeenCalledWith(expect.any(DeleteMessageCommand));
    });

    test('should handle no messages', async () => {
        (sqsClientMock.send as jest.Mock).mockImplementation((command) => {
            if (command instanceof ReceiveMessageCommand) {
                return Promise.resolve({ Messages: [] });
            }
            return Promise.resolve({});
        });

        await notificationService.processMessages();

        expect(emailServiceMock.sendNotification).not.toHaveBeenCalled();
    });
});
