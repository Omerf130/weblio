import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AdminLeadDetailDto } from "@/types/lead";
import { getResendClient } from "./resend";

const SENDER = "Weblio <hello@weblio.co.il>";
const GUIDE_FILENAME = "weblio-5-website-mistakes-guide.pdf";

let cachedPdf: Buffer | null = null;

function getGuidePdf(): Buffer {
  if (!cachedPdf) {
    cachedPdf = readFileSync(join(process.cwd(), "public", "guides", "5.pdf"));
  }
  return cachedPdf;
}

function buildGuideEmailHtml(name: string): string {
  const displayName = name.trim().split(/\s+/)[0] || name;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <div style="text-align:center;margin-bottom:28px;">
        <h1 style="margin:0;font-size:28px;color:#1a1a2e;font-weight:800;">Weblio</h1>
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;color:#1a1a2e;font-weight:700;">
        היי ${displayName}, תודה שהורדת את המדריך! 🎉
      </h2>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4a4a5a;">
        המדריך <strong>״5 טעויות שהורסות לך את האתר״</strong> מצורף לאימייל הזה כקובץ PDF.
      </p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4a4a5a;">
        פתחו את הקובץ המצורף כדי לקרוא את המדריך המלא. מומלץ לשמור אותו למקרה שתרצו לחזור אליו בהמשך.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#4a4a5a;">
        יש שאלות? רוצים לדבר על האתר שלכם?
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#4a4a5a;">
        פשוט השיבו לאימייל הזה או צרו קשר דרך
        <a href="https://weblio.co.il" style="color:#6366f1;text-decoration:underline;">weblio.co.il</a>.
      </p>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-size:13px;color:#999;">
      © Weblio — בניית אתרים ופתרונות דיגיטליים
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSourceLabel(source: string): string {
  switch (source) {
    case "landingPage":
      return "דף נחיתה";
    case "website":
      return "אתר";
    default:
      return source;
  }
}

function buildNotificationHtml(lead: AdminLeadDetailDto): string {
  const rows: [string, string][] = [
    ["מספר ליד", `#${lead.leadNumber}`],
    ["שם", escapeHtml(lead.name)],
    ["אימייל", escapeHtml(lead.email)],
    ["טלפון", escapeHtml(lead.phone)],
  ];

  if (lead.message) {
    rows.push(["הודעה", escapeHtml(lead.message)]);
  }

  rows.push(["מקור", formatSourceLabel(lead.source)]);
  rows.push(["דף מקור", escapeHtml(lead.sourcePage)]);

  if (lead.utm_source) rows.push(["UTM Source", escapeHtml(lead.utm_source)]);
  if (lead.utm_medium) rows.push(["UTM Medium", escapeHtml(lead.utm_medium)]);
  if (lead.utm_campaign) rows.push(["UTM Campaign", escapeHtml(lead.utm_campaign)]);
  if (lead.utm_content) rows.push(["UTM Content", escapeHtml(lead.utm_content)]);

  const date = new Date(lead.createdAt);
  const formatted = date.toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  rows.push(["זמן שליחה", formatted]);

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:10px 14px;font-weight:700;color:#374151;white-space:nowrap;border-bottom:1px solid #f0f0f0;">${label}</td>
          <td style="padding:10px 14px;color:#1f2937;border-bottom:1px solid #f0f0f0;">${value}</td>
        </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">ליד חדש מדף הנחיתה 🔔</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">פרטי הפנייה:</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        ${tableRows}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="https://weblio.co.il/admin/leads"
           style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">
          צפייה בלידים
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendGuideEmail(
  to: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: "Resend client not configured" };
  }

  try {
    const pdf = getGuidePdf();
    const { error } = await resend.emails.send({
      from: SENDER,
      to,
      subject: "המדריך שלך מ-Weblio מוכן! 📖",
      html: buildGuideEmailHtml(name),
      attachments: [
        {
          filename: GUIDE_FILENAME,
          content: pdf,
        },
      ],
    });

    if (error) {
      console.error("[lead-emails] Guide email failed:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[lead-emails] Guide email error:", message);
    return { success: false, error: message };
  }
}

export async function sendLeadNotificationEmail(
  lead: AdminLeadDetailDto
): Promise<{ success: boolean; error?: string }> {
  const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    console.warn("[lead-emails] LEAD_NOTIFICATION_EMAIL is not set — owner notification skipped.");
    return { success: false, error: "LEAD_NOTIFICATION_EMAIL not configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: "Resend client not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to: notificationEmail,
      subject: `ליד חדש #${lead.leadNumber} — ${lead.name}`,
      html: buildNotificationHtml(lead),
    });

    if (error) {
      console.error("[lead-emails] Notification email failed:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[lead-emails] Notification email error:", message);
    return { success: false, error: message };
  }
}

export async function sendLandingLeadEmails(
  lead: AdminLeadDetailDto
): Promise<void> {
  const [guideResult, notificationResult] = await Promise.allSettled([
    sendGuideEmail(lead.email, lead.name),
    sendLeadNotificationEmail(lead),
  ]);

  if (guideResult.status === "rejected") {
    console.error("[lead-emails] Guide email promise rejected:", guideResult.reason);
  } else if (!guideResult.value.success) {
    console.error("[lead-emails] Guide email not sent:", guideResult.value.error);
  }

  if (notificationResult.status === "rejected") {
    console.error("[lead-emails] Notification promise rejected:", notificationResult.reason);
  } else if (!notificationResult.value.success) {
    console.error("[lead-emails] Notification not sent:", notificationResult.value.error);
  }
}
