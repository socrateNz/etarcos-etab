import { sendMail, type SendMailResult } from "./mailer";
import { welcomeEmail, passwordResetEmail } from "./templates";

export { sendMail } from "./mailer";
export type { SendMailResult } from "./mailer";

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  tempPassword: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = welcomeEmail(params);
  return sendMail({ to: params.email, subject, html, text });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  tempPassword: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = passwordResetEmail(params);
  return sendMail({ to: params.email, subject, html, text });
}
