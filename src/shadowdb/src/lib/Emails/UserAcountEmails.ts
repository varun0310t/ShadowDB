import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${baseUrl}/Users/reset-password/${resetToken}`;

  const emailData = {
    from: process.env.EMAIL_FROM || "noreply@shadowdb.tech",
    to: email,
    subject: "Reset Your ShadowDB Password",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #6b21a8; padding:.5px 0; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 20px 0;">ShadowDB Password Reset</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello,</p>
            <p>We received a request to reset your password for your ShadowDB account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6b21a8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #6b21a8;"><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Thank you,<br>The ShadowDB Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} ShadowDB. All rights reserved.</p>
          </div>
        </div>
      `,
  };

  await resend.emails.send(emailData);
  console.log(`Password reset email sent to ${email}`);
}