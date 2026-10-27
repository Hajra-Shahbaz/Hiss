import nodemailer, { Transporter } from "nodemailer";
import type { EmailInput } from "./validation";

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials missing from environment");
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransport;
}

export async function sendEmail(input: EmailInput): Promise<{ id: string }> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM missing from environment");

  const html = renderEmailTemplate(input);
  const text = renderPlainText(input);

  const info = await getTransport().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html,
    text,
  });
  return { id: info.messageId };
}

// ─────────────────────────────────────────────
// HTML template — email-safe (tables, inline styles)
// ─────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailTemplate(input: EmailInput): string {
  const messageHtml = escapeHtml(input.message).replace(/\n/g, "<br/>");
  const closing = input.closing ? escapeHtml(input.closing) : "";
  const button =
    input.buttonText && input.buttonUrl
      ? `
        <tr><td align="center" style="padding:8px 0 24px 0;">
          <a href="${escapeHtml(input.buttonUrl)}"
             style="background:#1e3a8a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;display:inline-block;font-weight:600;font-family:Georgia,serif;font-size:15px;">
            ${escapeHtml(input.buttonText)}
          </a>
        </td></tr>`
      : "";

  const image = input.imageUrl
    ? `
      <tr><td align="center" style="padding:0 0 24px 0;">
        <img src="${escapeHtml(input.imageUrl)}" alt="" width="520" style="max-width:100%;height:auto;border-radius:16px;display:block;" />
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5fb;font-family:Georgia,'Times New Roman',serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #dbe4f3;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#dbeafe,#eff6ff);padding:36px 32px 24px 32px;text-align:center;">
              <div style="font-size:32px;line-height:1;">💙</div>
              <h1 style="margin:12px 0 0 0;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1e3a8a;letter-spacing:0.2px;">
                ${escapeHtml(input.heading)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;font-size:16px;line-height:1.7;color:#0f172a;">
              <p style="margin:0 0 16px 0;">Hi ${escapeHtml(input.recipientName)},</p>
            </td>
          </tr>
          ${image}
          <tr>
            <td style="padding:0 32px 8px 32px;font-size:16px;line-height:1.7;color:#0f172a;">
              <p style="margin:0 0 20px 0;">${messageHtml}</p>
            </td>
          </tr>
          ${button}
          ${
            closing
              ? `<tr><td style="padding:0 32px 28px 32px;font-size:15px;line-height:1.7;color:#334155;font-style:italic;">${closing.replace(/\n/g, "<br/>")}</td></tr>`
              : ""
          }
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
              Sent with 💙
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderPlainText(input: EmailInput): string {
  const lines = [
    `Hi ${input.recipientName},`,
    "",
    input.heading,
    "",
    input.message,
  ];
  if (input.buttonText && input.buttonUrl) {
    lines.push("", `${input.buttonText}: ${input.buttonUrl}`);
  }
  if (input.closing) lines.push("", input.closing);
  return lines.join("\n");
}