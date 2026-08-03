import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PENDING_INVITE_KEY = "pending_invite_code";

let redeemInFlight = false;

export function stashInviteCode(code: string | null | undefined) {
  if (!code?.trim()) return;
  sessionStorage.setItem(PENDING_INVITE_KEY, code.trim().toUpperCase());
}

export function peekPendingInviteCode(): string | null {
  return sessionStorage.getItem(PENDING_INVITE_KEY);
}

export function clearPendingInviteCode() {
  sessionStorage.removeItem(PENDING_INVITE_KEY);
}

export async function lookupPendingInvite(code: string) {
  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from("app_invites")
    .select("id, invite_code, inviter_id, invitee_email, status")
    .eq("invite_code", normalized)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("Error looking up invite:", error);
    return null;
  }
  return data;
}

/**
 * Marks a pending invite as used and creates an accepted friendship
 * between the invitee and the inviter.
 */
export async function redeemAppInvite(
  code: string,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, message: "Missing invite code" };
  }

  const { data: invite, error: lookupError } = await supabase
    .from("app_invites")
    .select("id, inviter_id, status")
    .eq("invite_code", normalized)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) {
    console.error("Error looking up invite:", lookupError);
    return { ok: false, message: "Could not verify invite" };
  }

  if (!invite) {
    return { ok: false, message: "Invite not found or already used" };
  }

  if (invite.inviter_id === userId) {
    return { ok: false, message: "You can't redeem your own invite" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("app_invites")
    .update({
      status: "used",
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Error claiming invite:", updateError);
    return { ok: false, message: "Failed to redeem invite" };
  }

  if (!updated) {
    return { ok: false, message: "Invite not found or already used" };
  }

  const inviterId = invite.inviter_id;

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${inviterId}),and(user_id.eq.${inviterId},friend_id.eq.${userId})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status !== "accepted") {
      const { error: acceptError } = await supabase
        .from("friendships")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (acceptError) {
        console.error("Error accepting friendship from invite:", acceptError);
      }
    }
  } else {
    const { error: friendError } = await supabase.from("friendships").insert({
      user_id: userId,
      friend_id: inviterId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    });

    if (friendError && friendError.code !== "23505") {
      console.error("Error creating friendship from invite:", friendError);
      return {
        ok: true,
        message: "Invite redeemed, but friendship could not be created",
      };
    }
  }

  return { ok: true };
}

/** Redeems a stashed invite code after auth. Safe to call multiple times. */
export async function redeemPendingInviteIfAny(userId: string): Promise<boolean> {
  const code = peekPendingInviteCode();
  if (!code || redeemInFlight) return false;

  redeemInFlight = true;
  try {
    const result = await redeemAppInvite(code, userId);
    if (result.ok) {
      clearPendingInviteCode();
      toast.success("Invite accepted!", {
        description: "You're now friends. Head to Games to play together.",
      });
      return true;
    }

    // Definitive failures — drop the code so we don't keep retrying
    if (
      result.message?.includes("not found") ||
      result.message?.includes("already used") ||
      result.message?.includes("own invite")
    ) {
      clearPendingInviteCode();
      toast.error(result.message);
    } else if (result.message) {
      toast.error(result.message);
    }
    return false;
  } finally {
    redeemInFlight = false;
  }
}
