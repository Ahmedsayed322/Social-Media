import nodemailer from 'nodemailer';
import env from '../../../config/config.service';
export const SMTP = () => {
  const { MY_EMAIL, CONSUMER_SECRET } = env;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MY_EMAIL,
      pass: CONSUMER_SECRET,
    },
  });
  return transporter;
};
