import nodemailer from 'nodemailer';
import { Notification } from '../domain/Notification';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: `${process.env.MAIL_SMTP}`,
            port: 587,
            auth: {
                user: `${process.env.MAIL_USERNAME}`,
                pass: `${process.env.MAIL_PASSWORD}`,
            },
        });
    }

    public async sendNotification(notification: Notification) {
        const mailOptions = {
            from: `${process.env.MAIL_USERNAME || 'no-reply@healthmed.com'}`,
            to: notification.doctorEmail,
            subject: 'Health&Med - Nova consulta agendada',
            text: `Olá, Dr. ${notification.doctorName}!\nVocê tem uma nova consulta marcada!\n\nPaciente: ${notification.patientName}.\nData e horário: ${notification.scheduleDate}.`,
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`Email sent to ${notification.doctorEmail}`);
    }
}
