import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;

  const emailData = {
    from: process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>",
    to,
    subject: "Reset Your Password",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You have requested to reset your password. Click the link below to set a new password:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this password reset, 
            please ignore this email.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button above doesn't work, copy and paste this URL into your browser:<br>
            ${resetUrl}
          </p>
        </div>
      `,
  };

  await resend.emails.send(emailData);
  console.log(`Password reset email sent to ${to}`);
}