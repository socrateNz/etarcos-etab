const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Etarcos Etab";
const LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL || ""}/login`;

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f4f5f7; padding: 32px 0; margin: 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <tr><td>
              <p style="color: #6b7280; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 16px;">${APP_NAME}</p>
              <h1 style="font-size: 20px; margin: 0 0 16px; color: #111827;">${title}</h1>
              ${bodyHtml}
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function credentialsBlock(email: string, tempPassword: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 16px 0;">
      <tr><td style="padding: 16px 20px;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Identifiant</p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #111827; font-family: monospace;">${email}</p>
        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Mot de passe temporaire</p>
        <p style="margin: 0; font-size: 14px; color: #111827; font-family: monospace;">${tempPassword}</p>
      </td></tr>
    </table>
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      Ce mot de passe est à usage unique — vous devrez en choisir un nouveau dès votre première connexion.
    </p>
    <a href="${LOGIN_URL}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
      Se connecter
    </a>`;
}

export function welcomeEmail(params: { name: string; email: string; tempPassword: string }) {
  const { name, email, tempPassword } = params;
  return {
    subject: `Bienvenue sur ${APP_NAME} — vos identifiants de connexion`,
    html: wrap(
      `Bienvenue, ${name}`,
      `<p style="font-size: 14px; color: #374151; margin: 0 0 16px;">
         Un compte vient d'être créé pour vous sur ${APP_NAME}. Voici vos identifiants de connexion :
       </p>${credentialsBlock(email, tempPassword)}`
    ),
    text: `Bienvenue sur ${APP_NAME}\n\nUn compte a été créé pour vous.\nIdentifiant : ${email}\nMot de passe temporaire : ${tempPassword}\n\nConnexion : ${LOGIN_URL}\nVous devrez choisir un nouveau mot de passe dès votre première connexion.`,
  };
}

export function passwordResetEmail(params: { name: string; email: string; tempPassword: string }) {
  const { name, email, tempPassword } = params;
  return {
    subject: `${APP_NAME} — votre mot de passe a été réinitialisé`,
    html: wrap(
      `Réinitialisation de mot de passe`,
      `<p style="font-size: 14px; color: #374151; margin: 0 0 16px;">
         Bonjour ${name}, votre mot de passe a été réinitialisé par un administrateur. Voici votre nouveau mot de passe temporaire :
       </p>${credentialsBlock(email, tempPassword)}
       <p style="font-size: 13px; color: #6b7280; margin: 16px 0 0;">
         Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement l'administration de votre établissement.
       </p>`
    ),
    text: `${APP_NAME} — Réinitialisation de mot de passe\n\nBonjour ${name}, votre mot de passe a été réinitialisé.\nIdentifiant : ${email}\nNouveau mot de passe temporaire : ${tempPassword}\n\nConnexion : ${LOGIN_URL}\nSi vous n'êtes pas à l'origine de cette demande, contactez votre administration.`,
  };
}
