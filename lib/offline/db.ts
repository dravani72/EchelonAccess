"use client";

import Dexie, { type Table } from "dexie";
import type { Interaction, Mandate, OutreachItem, Person, ReviewTask, Role } from "@/types/domain";

export type SyncOperation = "create" | "update" | "delete";
export type SyncEntity = "people" | "roles" | "interactions" | "mandates" | "outreach_queue" | "review_tasks";

export type SyncQueueItem = {
  id?: number;
  workspaceId: string;
  entity: SyncEntity;
  operation: SyncOperation;
  localId: string;
  remoteId?: string;
  payload: unknown;
  status: "pending" | "syncing" | "synced" | "conflict" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export class EchelonOfflineDatabase extends Dexie {
  people!: Table<Person & { workspaceId: string; syncStatus: string }, string>;
  roles!: Table<Role & { workspaceId: string; syncStatus: string }, string>;
  interactions!: Table<Interaction & { workspaceId: string; syncStatus: string }, string>;
  mandates!: Table<Mandate & { workspaceId: string; syncStatus: string }, string>;
  outreachQueue!: Table<OutreachItem & { workspaceId: string; syncStatus: string }, string>;
  reviewTasks!: Table<ReviewTask & { workspaceId: string; syncStatus: string }, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("echelon-access-offline");
    this.version(1).stores({
      people: "id, workspaceId, syncStatus, displayName",
      roles: "id, workspaceId, syncStatus, personId",
      interactions: "id, workspaceId, syncStatus, personId, date",
      mandates: "id, workspaceId, syncStatus, status",
      outreachQueue: "id, workspaceId, syncStatus, status",
      reviewTasks: "id, workspaceId, syncStatus, status",
      syncQueue: "++id, workspaceId, entity, status, createdAt"
    });
  }
}

export const offlineDb = new EchelonOfflineDatabase();

export async function enqueueSync(item: Omit<SyncQueueItem, "status" | "attempts" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  return offlineDb.syncQueue.add({
    ...item,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now
  });
}
