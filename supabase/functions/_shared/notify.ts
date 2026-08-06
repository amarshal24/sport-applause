// Shared notification helper: writes an in-app notification and (when email
// infrastructure is configured) sends a matching notification email.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  email?: string | null;
  emailEnabled?: boolean;
};

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function emailHtml(title: string, body: string, link?: string) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0d1420;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#141d2b;border-radius:14px;padding:28px;color:#e6edf7">
    <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#f97316;font-weight:700">U⚡Sportz</div>
    <h1 style="font-size:20px;margin:14px 0 10px">${title}</h1>
    <p style="font-size:15px;line-height:1.55;color:#aab6c8;margin:0 0 22px">${body}</p>
    ${link ? `<a href="${link}" style="display:inline-block;background:#f97316;color:#0d1420;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:9px">View payout details</a>` : ""}
    <p style="font-size:12px;color:#6b7a90;margin-top:26px">You're receiving this because payout email alerts are on in your monetization settings.</p>
  </div>
</div>`;
}

/**
 * Sends the notification email through the project's email infrastructure when
 * it is available. Returns false (without throwing) when email sending is not
 * yet configured, so in-app alerts always succeed.
 */
async function sendNotificationEmail(
  supabase: SupabaseClient,
  to: string,
  title: string,
  body: string,
  link?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("enqueue_email", {
      to_email: to,
      subject: title,
      html_body: emailHtml(title, body, link),
    });
    if (error) {
      console.log("email skipped (infra not ready):", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.log("email skipped:", (e as Error).message);
    return false;
  }
}

export async function notify(supabase: SupabaseClient, input: NotifyInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  });
  if (error) console.error("notification insert failed:", error.message);

  let emailed = false;
  if (input.emailEnabled !== false && input.email) {
    emailed = await sendNotificationEmail(
      supabase,
      input.email,
      input.title,
      input.body,
      input.link,
    );
  }
  return { inApp: !error, emailed };
}
