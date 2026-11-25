/**
 * Pure helpers for the direct-message thread. Kept free of React/Supabase so the
 * ordering and de-duplication rules can be unit tested.
 */

export interface ChatRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  image_url?: string | null;
  read: boolean;
  read_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  imageUrl: string | null;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  isMine: boolean;
}

/** Map a chat_messages row to the shape the UI renders. */
export function rowToThreadMessage(row: ChatRow, userId: string, deliveredFallback: string | null = null): ThreadMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    imageUrl: row.image_url ?? null,
    read: row.read,
    readAt: row.read_at ?? null,
    deliveredAt: row.delivered_at ?? deliveredFallback,
    createdAt: row.created_at,
    isMine: row.sender_id === userId,
  };
}

/** True when the row belongs to the thread between `userId` and `partnerId`. */
export function belongsToThread(row: Pick<ChatRow, "sender_id" | "recipient_id">, userId: string, partnerId: string | undefined): boolean {
  if (!partnerId) return false;
  return (
    (row.sender_id === userId && row.recipient_id === partnerId) ||
    (row.sender_id === partnerId && row.recipient_id === userId)
  );
}

/**
 * Append a message once. The same message can arrive from the insert response,
 * the realtime echo and a refetch, so it is keyed by id; the result stays in
 * chronological order.
 */
export function appendUnique(list: ThreadMessage[], incoming: ThreadMessage): ThreadMessage[] {
  const index = list.findIndex((m) => m.id === incoming.id);
  if (index >= 0) {
    // Keep the newest receipt state (delivered/read) if we already hold the row.
    const merged = { ...list[index], ...incoming, isMine: list[index].isMine };
    if (JSON.stringify(merged) === JSON.stringify(list[index])) return list;
    const next = list.slice();
    next[index] = merged;
    return next;
  }
  const next = [...list, incoming];
  next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return next;
}
