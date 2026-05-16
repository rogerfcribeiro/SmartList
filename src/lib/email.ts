import { Resend } from 'resend';

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? 'SmartList <onboarding@resend.dev>';
  await resend.emails.send({
    from,
    to,
    subject: 'Redefinir sua senha — SmartList',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Redefinir senha</h2>
        <p>Olá, ${name}!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta SmartList.</p>
        <p>
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#666;font-size:14px;">Este link expira em 30 minutos. Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
  });
}
