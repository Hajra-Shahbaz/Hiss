import nodemailer, { Transporter } from "nodemailer";
import type { EmailInput } from "./validation";

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

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
    headers: {
      "X-Entity-Ref-ID": `umer-${Date.now()}`,
      "List-Unsubscribe": `<mailto:${from}?subject=unsubscribe>`,
    },
  });
  return { id: info.messageId };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\r?\n/g, "<br/>");
}

function safeUrl(u: string | undefined): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Default sticker — inline SVG (no external
// dependency, works in every email client).
// Pink circle with a pink heart.
// ─────────────────────────────────────────────

const DEFAULT_STICKER_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#fdf2f8"/>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#fbcfe8" stroke-width="2"/>
    <path d="M50 78 C 30 60, 18 48, 18 36 A 14 14 0 0 1 50 30 A 14 14 0 0 1 82 36 C 82 48, 70 60, 50 78 Z" fill="#ec4899"/>
  </svg>`);

// ─────────────────────────────────────────────
// ✨ Flat 2D · Soft Pink & Blue · Centered CTA
// ─────────────────────────────────────────────

export function renderEmailTemplate(input: EmailInput): string {
  const safeHeading = escapeHtml(input.heading);
  const safeRecipient = escapeHtml(input.recipientName);
  const messageHtml = nl2br(input.message);
  const closing = input.closing ? nl2br(input.closing) : "";
  const customImage = safeUrl(input.imageUrl);
  const buttonUrl = safeUrl(input.buttonUrl);
  const buttonText = input.buttonText ? escapeHtml(input.buttonText) : "";
  const subject = escapeHtml(input.subject);
  const preheader = escapeHtml(
    input.message.replace(/\s+/g, " ").slice(0, 140),
  );

  // Hero image (custom) — above message
  const heroImage = customImage
    ? `
      <tr>
        <td align="center" style="padding:0 40px 24px 40px;">
          <img
            src="${customImage}"
            alt=""
            width="520"
            style="display:block;width:100%;max-width:520px;height:auto;border:0;outline:none;text-decoration:none;border-radius:12px;"
          />
        </td>
      </tr>`
    : "";

  // Default sticker — bottom-left below message
  const sticker = !customImage
    ? `
      <tr>
        <td align="left" style="padding:0 40px 24px 40px;">
          <img
            src="${DEFAULT_STICKER_URL}"
            alt=""
            width="80"
            height="80"
            style="display:block;width:80px;height:80px;border:0;outline:none;text-decoration:none;border-radius:12px;"
          />
        </td>
      </tr>`
    : "";

  // ─── Clean 2D centered CTA button ───────────
  // Solid pink pill. No gradient, no shadow.
  // Renders identically in Gmail / Outlook / Apple Mail.
  const button =
    buttonText && buttonUrl
      ? `
      <tr>
        <td align="center" style="padding:12px 40px 32px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td
                align="center"
                bgcolor="#ec4899"
                style="background-color:#ec4899;border-radius:10px;mso-padding-alt:16px 40px;"
              >
                <a
                  href="${buttonUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block;padding:16px 40px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;border-radius:10px;line-height:1;"
                >
                  ${buttonText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      : "";

  const closingBlock = closing
    ? `
      <tr>
        <td style="padding:0 40px 32px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td
                style="border-top:1px solid #e2e8f0;padding-top:20px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.7;color:#64748b;font-style:italic;"
              >
                ${closing}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body
  style="margin:0;padding:0;width:100%;background-color:#f8fafc;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;"
>
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
    ${"&nbsp;&zwnj;".repeat(40)}
  </div>

  <!-- Outer background -->
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#f8fafc;"
  >
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- ═══════════════ CARD ═══════════════ -->
        <table
          role="presentation"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;"
        >

          <!-- ─── Top bar (flat pink) ─── -->
          <tr>
            <td
              bgcolor="#ec4899"
              style="background-color:#ec4899;padding:20px 40px;"
            >
              <p
                style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#ffffff;text-align:center;"
              >
                A Little Message
              </p>
            </td>
          </tr>

          <!-- ─── Heading (soft blue, centered) ─── -->
          <tr>
            <td style="padding:36px 40px 12px 40px;" align="center">
              <h1
                style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:22px;line-height:1.4;font-weight:700;color:#3b82f6;letter-spacing:-0.2px;"
              >
                ${safeHeading}
              </h1>
            </td>
          </tr>

          <!-- ─── Greeting ─── -->
          <tr>
            <td style="padding:0 40px 16px 40px;">
              <p
                style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.7;color:#475569;"
              >
                Hi ${safeRecipient},
              </p>
            </td>
          </tr>

          <!-- ─── Optional hero image ─── -->
          ${heroImage}

          <!-- ─── Message body ─── -->
          <tr>
            <td style="padding:0 40px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.75;color:#334155;">
              <p style="margin:0 0 20px 0;">${messageHtml}</p>
            </td>
          </tr>

          <!-- ─── Default sticker (only when no custom image) ─── -->
          ${sticker}

          <!-- ─── Centered 2D CTA ─── -->
          ${button}

          <!-- ─── Optional closing ─── -->
          ${closingBlock}

          <!-- ─── Footer ─── -->
          <tr>
            <td
              bgcolor="#f8fafc"
              style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;"
            >
              <p
                style="margin:0 0 6px 0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.6;color:#64748b;text-align:center;"
              >
                Sent with love
                <span style="color:#ec4899;">♥</span>
                <span style="color:#3b82f6;">♥</span>
              </p>
              <p
                style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8;text-align:center;"
              >
                This message was made just for you.
              </p>
            </td>
          </tr>

        </table>
        <!-- ═══════════════ /CARD ═══════════════ -->

        <!-- ─── Bottom copyright ─── -->
        <table
          role="presentation"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="width:100%;max-width:600px;"
        >
          <tr>
            <td
              align="center"
              style="padding:24px 16px 0 16px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8;"
            >
              © ${new Date().getFullYear()} · Made with care
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Plain-text fallback
// ─────────────────────────────────────────────

function renderPlainText(input: EmailInput): string {
  const lines: string[] = [
    input.heading,
    "",
    `Hi ${input.recipientName},`,
    "",
    input.message,
  ];
  if (input.buttonText && input.buttonUrl) {
    lines.push("", `${input.buttonText}: ${input.buttonUrl}`);
  }
  if (input.imageUrl) {
    lines.push("", `Image: ${input.imageUrl}`);
  }
  if (input.closing) {
    lines.push("", input.closing);
  }
  lines.push("", "—", "Sent with love.");
  return lines.join("\n");
}