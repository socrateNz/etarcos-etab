import nodemailer, { type Transporter } from "nodemailer";

// NOTE: nodemailer is pinned to 8.0.11 (matching the range next-auth's
// @auth/core already requires) rather than the patched 9.0.3, to avoid an
// invalid/conflicting dependency tree. The known advisory for 8.x
// (GHSA-p6gq-j5cr-w38f) only affects the `raw` message option — this module
// never uses it (only structured to/subject/html/text), so the vulnerable
// code path is unreachable here.

let transporter: Transporter | null | undefined;
let warned = false;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn(
        "[mailer] SMTP_HOST/PORT/USER/PASS absents — l'envoi d'email est désactivé (dégradation gracieuse). " +
          "Les mots de passe temporaires restent affichés dans l'UI comme filet de secours. " +
          "À configurer avant la mise en production."
      );
      warned = true;
    }
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendMailResult = { sent: true } | { sent: false; reason: "not_configured" | "error" };

/**
 * Best-effort transactional email. Never throws — every call site treats
 * email as a redundant delivery channel on top of the temp password already
 * shown in the UI, so a mail failure must never break the surrounding
 * account-creation/reset flow.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const t = getTransporter();
  if (!t) return { sent: false, reason: "not_configured" };

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] Échec de l'envoi d'email:", err);
    return { sent: false, reason: "error" };
  }
}
