import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;
  
  const emailData = {
    from: process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>",
    to,
    subject: "Verify your account",
    html: `
      <p>Please verify your account by clicking the following link:</p>
      <p><a href="${verificationUrl}">Verify Account</a></p>
    `,
  };

  await resend.emails.send(emailData);
  console.log(`Verification email sent to ${to}`);
}