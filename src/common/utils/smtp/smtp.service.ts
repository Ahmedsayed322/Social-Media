import env from '../../../config/config.service';
import { ApiError } from '../ApiError/ApiError';
import { SMTP } from './smtp.config';
export class SMTPService {
  constructor(private transporter: any) {}
  sendEmail = async (
    email: string,
    subject: string,
    text: string,
    html: string,
  ) => {
    try {
      const info = await this.transporter.sendMail({
        from: `"Ahmed Sayed" <${env.MY_EMAIL}>`,
        to: email,
        subject: subject,
        text: text,
        html: html,
      });
      return info;
    } catch {
      throw new ApiError('Failed to send email', 500);
    }
  };
  sendOTP = async (email: string, subject: string, otp: number) => {
    await this.sendEmail(email, subject, 'No-reply', `<h1>${otp}</h1>`);
  };
}
export default new SMTPService(SMTP());
