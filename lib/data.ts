import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { interactions, mandates, outreachQueue, people, reviewTasks, roles } from "@/lib/mock-data";
import type { Interaction, Mandate, OutreachItem, Person, ReviewTask, Role } from "@/types/domain";

export type AppData = {
  people: Person[];
  roles: Role[];
  interactions: Interaction[];
  mandates: Mandate[];
  outreachQueue: OutreachItem[];
  reviewTasks: ReviewTask[];
  source: "supabase" | "mock";
};

export async function getAppData(): Promise<AppData> {
  if (!hasSupabaseConfig()) {
    return getMockData();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [peopleResult, rolesResult, interactionsResult, mandatesResult, outreachResult, reviewResult] = await Promise.all([
      supabase.from("people").select("*").order("updated_at", { ascending: false }),
      supabase.from("roles").select("*").order("is_current", { ascending: false }),
      supabase.from("interactions").select("*").order("interaction_date", { ascending: false }),
      supabase.from("mandates").select("*").order("updated_at", { ascending: false }),
      supabase.from("outreach_queue").select("*").order("due_date", { ascending: true }),
      supabase.from("review_tasks").select("*").order("updated_at", { ascending: false })
    ]);

    const hasError = [peopleResult, rolesResult, interactionsResult, mandatesResult, outreachResult, reviewResult].some(
      (result) => result.error
    );

    if (hasError) {
      return getMockData();
    }

    return {
      people: (peopleResult.data ?? []).map(mapPerson),
      roles: (rolesResult.data ?? []).map(mapRole),
      interactions: (interactionsResult.data ?? []).map(mapInteraction),
      mandates: (mandatesResult.data ?? []).map(mapMandate),
      outreachQueue: (outreachResult.data ?? []).map(mapOutreachItem),
      reviewTasks: (reviewResult.data ?? []).map(mapReviewTask),
      source: "supabase"
    };
  } catch {
    return getMockData();
  }
}

function getMockData(): AppData {
  return {
    people,
    roles,
    interactions,
    mandates,
    outreachQueue,
    reviewTasks,
    source: "mock"
  };
}

function mapPerson(row: {
  id: string;
  canonical_name: string;
  display_name: string;
  honorific: string | null;
  aliases: string[];
  notes: string | null;
  relationship_strength: number;
  trust_level: Person["trustLevel"] | null;
  warmth_status: Person["warmthStatus"];
  current_title: string | null;
  current_organization: string | null;
  last_interaction: string | null;
  geography: string | null;
  sector_tags: string[];
  source_count: number;
  mandate_matches: number;
  review_status: Person["reviewStatus"];
}): Person {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    honorific: row.honorific ?? undefined,
    aliases: row.aliases,
    notes: row.notes ?? undefined,
    relationshipStrength: clampStrength(row.relationship_strength),
    trustLevel: row.trust_level ?? undefined,
    warmthStatus: row.warmth_status,
    currentTitle: row.current_title ?? "Unknown role",
    currentOrganization: row.current_organization ?? "Unknown organization",
    lastInteraction: row.last_interaction ?? "No interaction",
    geography: row.geography ?? "Unknown",
    sectorTags: row.sector_tags,
    sourceCount: row.source_count,
    mandateMatches: row.mandate_matches,
    reviewStatus: row.review_status
  };
}

function mapRole(row: {
  id: string;
  person_id: string;
  organization_name: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  confidence: number;
  source_label: string;
}): Role {
  return {
    id: row.id,
    personId: row.person_id,
    organizationName: row.organization_name,
    title: row.title,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    isCurrent: row.is_current,
    confidence: row.confidence,
    sourceLabel: row.source_label
  };
}

function mapInteraction(row: {
  id: string;
  person_id: string | null;
  interaction_date: string;
  type: Interaction["type"];
  summary: string;
  outcome: string | null;
  next_step: string | null;
  confidence: number;
  source_label: string;
}): Interaction {
  return {
    id: row.id,
    personId: row.person_id ?? undefined,
    date: row.interaction_date,
    type: row.type,
    summary: row.summary,
    outcome: row.outcome ?? undefined,
    nextStep: row.next_step ?? undefined,
    confidence: row.confidence,
    sourceLabel: row.source_label
  };
}

function mapMandate(row: {
  id: string;
  client_name: string;
  title: string;
  objective: string;
  sector: string | null;
  geography: string[];
  status: Mandate["status"];
  relevant_contacts: number;
  next_action: string | null;
}): Mandate {
  return {
    id: row.id,
    clientName: row.client_name,
    title: row.title,
    objective: row.objective,
    sector: row.sector ?? undefined,
    geography: row.geography,
    status: row.status,
    relevantContacts: row.relevant_contacts,
    nextAction: row.next_action ?? "Define next action"
  };
}

function mapOutreachItem(row: {
  id: string;
  person_name: string;
  mandate_title: string;
  reason: string;
  channel: OutreachItem["channel"];
  relationship_strength: number;
  risk_level: OutreachItem["riskLevel"];
  due_date: string | null;
  status: OutreachItem["status"];
}): OutreachItem {
  return {
    id: row.id,
    personName: row.person_name,
    mandateTitle: row.mandate_title,
    reason: row.reason,
    channel: row.channel,
    relationshipStrength: clampStrength(row.relationship_strength),
    riskLevel: row.risk_level,
    dueDate: row.due_date ?? "Unscheduled",
    status: row.status
  };
}

function mapReviewTask(row: {
  id: string;
  title: string;
  detail: string;
  status: ReviewTask["status"];
}): ReviewTask {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    status: row.status
  };
}

function clampStrength(value: number): Person["relationshipStrength"] {
  if (value >= 5) return 5;
  if (value <= 1) return 1;
  return value as Person["relationshipStrength"];
}
