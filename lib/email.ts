import nodemailer, { Transporter } from "nodemailer";
import type { EmailInput } from "./validation";

export interface PersonalEmailInput extends EmailInput {
  monogram?: string; // e.g. "U" or "U & A"
  photoCaption?: string;
  replyTo?: string;
}

let cachedTransport: Transporter | null = null;
let cachedConfigKey = "";

function getTransport(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials missing from environment");
  }

  const configKey = `${host}:${port}:${user}:${secure}`;
  if (cachedTransport && cachedConfigKey === configKey) {
    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  cachedConfigKey = configKey;
  return cachedTransport;
}

export async function sendEmail(
  input: PersonalEmailInput,
): Promise<{ id: string }> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM missing from environment");

  const html = renderEmailTemplate(input);
  const text = renderPlainText(input);

  const info = await getTransport().sendMail({
    from,
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
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
// Design tokens
//   Soft blush + dusty slate blue + warm cream.
//   Refined, intimate, flat, and reliable across
//   all major email clients.
// ─────────────────────────────────────────────

const C = {
  ink: "#23263b", // deep midnight ink
  body: "#3f435c", // warm charcoal-navy body text
  muted: "#7c819c", // soft metadata & captions
  blush: "#f4c2d7", // subtle romantic pink accent
  blushSoft: "#fdf4f8", // gentle note surface
  blushBorder: "#f2d5e2",
  accent: "#c24178", // refined rose-berry CTA button
  sky: "#b8cef5", // muted powder blue
  skySoft: "#eef3fb", // calm outer stationery background
  skyBorder: "#d7e3f7",
  card: "#fffefe", // crisp warm-white paper
};

const FONT =
  "'Plus Jakarta Sans','Inter','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

// ─────────────────────────────────────────────
// Template
// ─────────────────────────────────────────────

export function renderEmailTemplate(input: PersonalEmailInput): string {
  const safeHeading = escapeHtml(input.heading);
  const safeRecipient = escapeHtml(input.recipientName);
  const safeMonogram = escapeHtml((input.monogram ?? "♡").trim().slice(0, 5));
  const safeCaption = input.photoCaption
    ? escapeHtml(input.photoCaption.trim())
    : "";
  const messageHtml = nl2br(input.message);
  const closing = input.closing ? nl2br(input.closing) : "";
  const customImage = safeUrl(input.imageUrl);
  const buttonUrl = safeUrl(input.buttonUrl);
  const buttonText = input.buttonText ? escapeHtml(input.buttonText) : "";
  const subject = escapeHtml(input.subject);
  const preheader = escapeHtml(
    input.message.replace(/\s+/g, " ").slice(0, 140),
  );

  const photoBlock = customImage
    ? `
          <tr>
            <td class="px" style="padding:0 44px 26px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.skySoft};border:1px solid ${C.skyBorder};border-radius:16px;padding:12px;">
                <tr>
                  <td align="center">
                    <img
                      src="${escapeHtml(customImage)}"
                      alt="${safeCaption || safeHeading}"
                      width="490"
                      style="display:block;width:100%;max-width:490px;height:auto;border:0;outline:none;text-decoration:none;border-radius:11px;"
                    />
                  </td>
                </tr>
                ${
                  safeCaption
                    ? `
                <tr>
                  <td align="center" style="padding:10px 8px 2px 8px;font-family:${SERIF};font-size:13px;font-style:italic;color:${C.muted};">
                    ${safeCaption}
                  </td>
                </tr>`
                    : `
                <tr>
                  <td align="right" style="padding:8px 6px 2px 6px;font-family:${SERIF};font-size:11px;letter-spacing:1.5px;color:${C.muted};">
                    &#10022; &#183; &#10022;
                  </td>
                </tr>`
                }
              </table>
            </td>
          </tr>`
    : "";

  const buttonBlock =
    buttonText && buttonUrl
      ? `
          <tr>
            <td align="center" class="px" style="padding:4px 44px 10px 44px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td
                    align="center"
                    bgcolor="${C.accent}"
                    style="background-color:${C.accent};border-radius:12px;mso-padding-alt:14px 30px;"
                  >
                    <a
                      href="${escapeHtml(buttonUrl)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;line-height:1.2;letter-spacing:0.2px;"
                    >
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="px" style="padding:0 44px 28px 44px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
              Or open this link directly:<br/>
              <a href="${escapeHtml(buttonUrl)}" target="_blank" rel="noopener noreferrer" style="color:${C.muted};text-decoration:underline;word-break:break-all;">${escapeHtml(buttonUrl)}</a>
            </td>
          </tr>`
      : `
          <tr><td style="font-size:0;line-height:0;height:12px;">&nbsp;</td></tr>`;

  const closingBlock = closing
    ? `
          <tr>
            <td class="px" style="padding:2px 44px 34px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid ${C.skyBorder};padding-top:20px;font-family:${SERIF};font-size:16px;line-height:1.75;color:${C.ink};font-style:italic;">
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    @media only screen and (max-width:620px) {
      .px { padding-left:24px !important; padding-right:24px !important; }
      .shell { padding:20px 10px !important; }
      .letter-box { padding:22px !important; }
      .h1 { font-size:24px !important; }
    }
  </style>
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
  style="margin:0;padding:0;width:100%;background-color:${C.skySoft};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${FONT};color:${C.ink};"
>
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:${C.skySoft};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
    ${"&nbsp;&zwnj;".repeat(40)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.skySoft};">
    <tr>
      <td align="center" class="shell" style="padding:38px 16px;">

        <!-- Subtle top stationery line + tiny doodle -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;margin-bottom:10px;">
          <tr>
            <td align="left" style="font-family:${SERIF};font-size:12px;color:${C.muted};letter-spacing:0.6px;">
              <span style="color:${C.accent};">&#10022;</span> a quiet note
            </td>
            <td align="right" style="font-family:${SERIF};font-size:12px;color:${C.muted};letter-spacing:1.5px;">
              &#183; &#10022; &#183;
            </td>
          </tr>
        </table>

        <!-- ═══════════════ STATIONERY CARD ═══════════════ -->
        <table
          role="presentation"
          width="580"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="width:100%;max-width:580px;background-color:${C.card};border:1px solid ${C.skyBorder};border-radius:20px;overflow:hidden;"
        >

          <!-- Delicate split accent bar -->
          <tr>
            <td style="font-size:0;line-height:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="55%" height="5" bgcolor="${C.blush}" style="background-color:${C.blush};height:5px;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="45%" height="5" bgcolor="${C.sky}" style="background-color:${C.sky};height:5px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header with monogram seal + editorial title -->
          <tr>
            <td align="center" class="px" style="padding:32px 44px 12px 44px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 14px auto;">
                <tr>
                  <td
                    align="center"
                    valign="middle"
                    style="padding:7px 16px;background-color:${C.blushSoft};border:1px solid ${C.blushBorder};border-radius:999px;font-family:${SERIF};font-size:13px;font-style:italic;color:${C.accent};letter-spacing:0.4px;"
                  >
                    ${safeMonogram}
                  </td>
                </tr>
              </table>

              <h1
                class="h1"
                style="margin:0;font-family:${SERIF};font-size:28px;line-height:1.28;font-weight:400;color:${C.ink};letter-spacing:-0.2px;"
              >
                ${safeHeading}
              </h1>

              <!-- Minimalist hand-drawn style divider -->
              <div style="margin:16px auto 0 auto;font-family:${SERIF};font-size:13px;color:${C.muted};letter-spacing:4px;">
                &#8212; &#10022; &#8212;
              </div>
            </td>
          </tr>

          <!-- Optional photo -->
          ${photoBlock}

          <!-- Personal note sheet -->
          <tr>
            <td class="px" style="padding:4px 44px 26px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td
                    class="letter-box"
                    bgcolor="${C.blushSoft}"
                    style="background-color:${C.blushSoft};border:1px solid ${C.blushBorder};border-radius:16px;padding:26px 30px;"
                  >
                    <p style="margin:0 0 14px 0;font-family:${SERIF};font-size:18px;line-height:1.45;font-style:italic;color:${C.ink};">
                      Hey ${safeRecipient},
                    </p>
                    <p style="margin:0;font-family:${FONT};font-size:15.5px;line-height:1.8;font-weight:400;color:${C.body};">
                      ${messageHtml}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Optional button -->
          ${buttonBlock}

          <!-- Sign-off -->
          ${closingBlock}

          <!-- Quiet footer -->
          <tr>
            <td
              align="center"
              bgcolor="${C.skySoft}"
              style="background-color:${C.skySoft};border-top:1px solid ${C.skyBorder};padding:18px 44px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};"
            >
              Sent with care <span style="color:${C.accent};">&#10022;</span> just for you
            </td>
          </tr>

        </table>
        <!-- ═══════════════ /STATIONERY CARD ═══════════════ -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Plain-text fallback
// ─────────────────────────────────────────────

function renderPlainText(input: PersonalEmailInput): string {
  const lines: string[] = [
    input.heading,
    "---",
    `Hey ${input.recipientName},`,
    "",
    input.message,
  ];

  if (input.buttonText && input.buttonUrl) {
    lines.push("", `${input.buttonText}: ${input.buttonUrl}`);
  }
  if (input.imageUrl) {
    lines.push(
      "",
      input.photoCaption
        ? `${input.photoCaption}: ${input.imageUrl}`
        : `Photo: ${input.imageUrl}`,
    );
  }
  if (input.closing) {
    lines.push("", input.closing);
  }
  lines.push("", "—", "Sent with care · just for you");
  return lines.join("\n");
}