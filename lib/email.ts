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
    // Improves deliverability + prevents auto-replies fighting back
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

/** Preserve line breaks in plain user content */
function nl2br(s: string): string {
  return escapeHtml(s).replace(/\r?\n/g, "<br/>");
}

/** Safe URL check — we don't want to include javascript: links */
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
// HTML template
// ─────────────────────────────────────────────
//
// Design notes:
//  • Table-based layout (Outlook-safe)
//  • Inline styles only (Gmail strips <style>)
//  • 600px max width (standard safe width)
//  • Preheader text for inbox preview
//  • Fluid typography with px fallbacks
//  • Rounded corners via border-radius (with graceful fallback)
//  • Colors match the site: powder blue / deep ink
//

export function renderEmailTemplate(input: EmailInput): string {
  const safeHeading = escapeHtml(input.heading);
  const safeRecipient = escapeHtml(input.recipientName);
  const messageHtml = nl2br(input.message);
  const closing = input.closing ? nl2br(input.closing) : "";
  const imageUrl = safeUrl(input.imageUrl);
  const buttonUrl = safeUrl(input.buttonUrl);
  const buttonText = input.buttonText ? escapeHtml(input.buttonText) : "";
  const subject = escapeHtml(input.subject);
  const preheader = escapeHtml(
    input.message.replace(/\s+/g, " ").slice(0, 140),
  );

  const heroImage = imageUrl
    ? `
      <tr>
        <td align="center" style="padding:0;">
          <img
            src="${imageUrl}"
            alt=""
            width="600"
            style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;"
          />
        </td>
      </tr>`
    : "";

  const button =
    buttonText && buttonUrl
      ? `
      <tr>
        <td align="center" style="padding:8px 40px 32px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td
                align="center"
                bgcolor="#1e3a8a"
                style="border-radius:9999px;mso-padding-alt:14px 32px;"
              >
                <a
                  href="${buttonUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block;padding:14px 32px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;border-radius:9999px;"
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
                style="border-top:1px solid #e2e8f0;padding-top:24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#475569;font-style:italic;"
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
  style="margin:0;padding:0;width:100%;background-color:#f1f5fb;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:Georgia,'Times New Roman',serif;color:#0f172a;"
>
  <!-- Preheader: shown in inbox preview, hidden in email body -->
  <div style="display:none;font-size:1px;color:#f1f5fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
    ${"&nbsp;&zwnj;".repeat(40)}
  </div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#f1f5fb;"
  >
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table
          role="presentation"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="width:100%;max-width:600px;background-color:#ffffff;border-radius:24px;border:1px solid #dbe4f3;overflow:hidden;"
        >

          <!-- Top brand bar -->
          <tr>
            <td
              align="center"
              style="background:linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%);background-color:#dbeafe;padding:36px 40px 28px 40px;"
            >
              <div style="font-size:34px;line-height:1;margin-bottom:14px;">💙</div>
              <h1
                style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.35;font-weight:600;color:#1e3a8a;letter-spacing:0.2px;"
              >
                ${safeHeading}
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td
              style="padding:32px 40px 8px 40px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#0f172a;"
            >
              <p style="margin:0 0 4px 0;">Hi ${safeRecipient},</p>
            </td>
          </tr>

          <!-- Optional hero image -->
          ${heroImage}

          <!-- Message body -->
          <tr>
            <td
              style="padding:${
                imageUrl ? "24px 40px 8px 40px" : "8px 40px 8px 40px"
              };font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:#0f172a;"
            >
              <p style="margin:0 0 20px 0;">${messageHtml}</p>
            </td>
          </tr>

          <!-- Optional CTA button -->
          ${button}

          <!-- Optional closing line -->
          ${closingBlock}

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;"
            >
              <p
                style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:#64748b;"
              >
                Sent with <span style="color:#2563eb;">💙</span>
              </p>
              <p
                style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.6;color:#94a3b8;letter-spacing:0.3px;"
              >
                This message was sent to you with love.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

        <!-- Bottom spacer / tiny brand mark -->
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
              style="padding:24px 16px 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.6;color:#94a3b8;"
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
// Plain-text fallback (required for deliverability)
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