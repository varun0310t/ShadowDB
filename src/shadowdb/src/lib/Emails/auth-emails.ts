import { Resend } from 'resend';

// Initialize the Resend SDK with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface PasswordResetEmailProps {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailProps) {
  try {
    // Create email content
    const { data, error } = await resend.emails.send({
      from: `ShadowDB <${process.env.EMAIL_FROM || "no-reply@shadowdb.io"}>`,
      to,
      subject: 'Reset Your ShadowDB Password',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="ShadowDB Logo" style="max-height: 60px;" />
        </div>
        
        <div style="background-color: #151923; color: #fff; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="margin-top: 0; color: #a855f7; font-size: 24px;">Reset Your Password</h1>
          <p style="margin-bottom: 25px; color: #e2e8f0; font-size: 16px;">Hello ${name},</p>
          <p style="margin-bottom: 25px; color: #e2e8f0; font-size: 16px;">You recently requested to reset your password for your ShadowDB account. Use the button below to reset it. This password reset link is only valid for 1 hour.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #a855f7; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Your Password</a>
          </div>
          
          <p style="margin-bottom: 5px; color: #e2e8f0; font-size: 16px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin-bottom: 25px; word-break: break-all; color: #a855f7; font-size: 14px;">${resetUrl}</p>
          
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 5px;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>© ${new Date().getFullYear()} ShadowDB. All rights reserved.</p>
        </div>
      </div>
    `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
