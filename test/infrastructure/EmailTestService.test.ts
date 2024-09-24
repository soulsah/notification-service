import { EmailService } from '../../src/infrastructure/EmailService';
import { Notification } from '../../src/domain/Notification';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
    let emailService: EmailService;
    let sendMailMock: jest.Mock;

    beforeAll(() => {
        sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
        (nodemailer.createTransport as jest.Mock).mockReturnValue({
            sendMail: sendMailMock,
        });

        emailService = new EmailService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should send email with correct parameters', async () => {
        const notification: Notification = {
            doctorName: 'João',
            doctorEmail: 'dr.joao@example.com',
            patientName: 'Maria Silva',
            scheduleDate: '10-10-2024',
        };

        await emailService.sendNotification(notification);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock).toHaveBeenCalledWith({
            from: 'no-reply@healthmed.com',
            to: notification.doctorEmail,
            subject: 'Health&Med - Nova consulta agendada',
            text: `Olá, Dr. ${notification.doctorName}!\nVocê tem uma nova consulta marcada!\n\nPaciente: ${notification.patientName}.\nData e horário: ${notification.scheduleDate}.`,
        });
    });

    test('should handle send email error', async () => {
        sendMailMock.mockRejectedValueOnce(new Error('SMTP Error'));

        const notification: Notification = {
            doctorName: 'Dr. João',
            doctorEmail: 'dr.joao@example.com',
            patientName: 'Maria Silva',
            scheduleDate: '10-10-2024',
        };

        await expect(emailService.sendNotification(notification)).rejects.toThrow('SMTP Error');
    });
});
