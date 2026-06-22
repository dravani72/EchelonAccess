"use client";

import { offlineDb, type SyncQueueItem } from "@/lib/offline/db";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export async function syncPendingChanges() {
  if (!hasSupabaseConfig() || !navigator.onLine) {
    return { synced: 0, failed: 0, skipped: true };
  }

  const supabase = createSupabaseBrowserClient() as never as {
    from: (table: string) => {
      insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
      update: (payload: unknown) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
  const pending = await offlineDb.syncQueue.where("status").equals("pending").toArray();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    await offlineDb.syncQueue.update(item.id!, {
      status: "syncing",
      attempts: item.attempts + 1,
      updatedAt: new Date().toISOString()
    });

    const result = await pushItem(supabase, item);

    if (result.ok) {
      synced += 1;
      await offlineDb.syncQueue.update(item.id!, {
        status: "synced",
        updatedAt: new Date().toISOString()
      });
    } else {
      failed += 1;
      await offlineDb.syncQueue.update(item.id!, {
        status: "failed",
        lastError: result.error,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return { synced, failed, skipped: false };
}

async function pushItem(
  supabase: {
    from: (table: string) => {
      insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
      update: (payload: unknown) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  },
  item: SyncQueueItem
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (item.operation === "delete" && item.remoteId) {
    const { error } = await supabase.from(item.entity).update({ deleted_at: new Date().toISOString() }).eq("id", item.remoteId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  if (item.operation === "create") {
    const { error } = await supabase.from(item.entity).insert(item.payload);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  if (item.operation === "update" && item.remoteId) {
    const { error } = await supabase.from(item.entity).update(item.payload as never).eq("id", item.remoteId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  return { ok: false, error: "Missing remote id for update/delete operation." };
}
