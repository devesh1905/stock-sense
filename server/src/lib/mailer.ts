import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter: nodemailer.Transporter | null = null;

if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'StockSense — Password Reset OTP',
        text: `Your password reset OTP is: ${otp}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #006ecb; margin-top: 0;">StockSense Password Reset</h2>
            <p>You requested a password reset for your StockSense account.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes and allows up to 5 attempts.</p>
          </div>
        `
      });
      console.log(`📧 OTP email dispatched to ${email}`);
      return;
    } catch (err) {
      console.error('Failed to send email via SMTP, falling back to console:', err);
    }
  }

  // Dev console fallback (per ROADMAP and MOCKUP-SPEC)
  console.log(`\n========================================`);
  console.log(`🔐 [DEV EMAIL OTP] To: ${email}`);
  console.log(`🔑 OTP CODE: ${otp}`);
  console.log(`⏳ Valid for 10 minutes`);
  console.log(`========================================\n`);
};
