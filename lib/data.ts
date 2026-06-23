import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { interactions, mandates, outreachQueue, people, reviewTasks, roles } from "@/lib/mock-data";
import type { Interaction, Mandate, OutreachItem, Person, ReviewTask, Role, Workspace } from "@/types/domain";

type SupabaseResult<T = Record<string, unknown>> = Promise<{ data: T[] | null; error: { message: string } | null }>;
type SupabaseSingleResult<T = Record<string, unknown>> = Promise<{ data: T | null; error: { message: string } | null }>;
type MembershipRow = {
  role: Workspace["role"];
  workspaces: { id: string; name: string; slug: string | null } | { id: string; name: string; slug: string | null }[] | null;
};
type UntypedSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => SupabaseResult & {
        order: (columnName: string, options?: { ascending?: boolean }) => SupabaseResult;
      };
      order: (columnName: string, options?: { ascending?: boolean }) => SupabaseResult;
      single: () => SupabaseSingleResult;
    };
    insert: (payload: unknown) => Promise<{ error: { message: string } | null }> & {
      select: (columns?: string) => {
        single: () => SupabaseSingleResult;
      };
    };
  };
};

export type AppData = {
  people: Person[];
  roles: Role[];
  interactions: Interaction[];
  mandates: Mandate[];
  outreachQueue: OutreachItem[];
  reviewTasks: ReviewTask[];
  workspaces: Workspace[];
  currentWorkspace?: Workspace;
  source: "supabase" | "mock";
  diagnostic?: string;
};

export async function getAppData(): Promise<AppData> {
  const configStatus = getSupabaseConfigStatus();

  if (configStatus.state !== "ready") {
    if (configStatus.isRequired) {
      return getEmptySupabaseData(configStatus.message);
    }

    return getMockData();
  }

  try {
    const supabase = (await createSupabaseServerClient()) as unknown as UntypedSupabase;
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return getEmptySupabaseData("Signed out. Supabase Auth is configured, but no server session is available yet.");
    }

    let { data: memberships, error: membershipError } = (await supabase
      .from("workspace_members")
      .select("role, workspaces(id, name, slug)")
      .eq("user_id", user.id)) as { data: MembershipRow[] | null; error: { message: string } | null };

    if (membershipError) {
      return getEmptySupabaseData(`Could not read workspace memberships: ${membershipError.message}`);
    }

    if (!memberships?.length) {
      const { data: workspace, error: workspaceError } = (await supabase
        .from("workspaces")
        .insert({
          name: "Private Relationship Desk",
          owner_id: user.id
        })
        .select("id, name, slug")
        .single()) as {
        data: { id: string; name: string; slug: string | null } | null;
        error: { message: string } | null;
      };

      if (workspaceError || !workspace) {
        return getEmptySupabaseData(
          `Could not create the first workspace: ${workspaceError?.message ?? "No workspace returned."}`
        );
      }

      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner"
      });

      if (memberError) {
        return getEmptySupabaseData(`Could not create the first workspace membership: ${memberError.message}`);
      }

      memberships = [
        {
          role: "owner",
          workspaces: workspace
        }
      ];
    }

    const workspaces = memberships
      .map((membership: MembershipRow) => {
        const workspace = Array.isArray(membership.workspaces) ? membership.workspaces[0] : membership.workspaces;
        if (!workspace) return null;
        return {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug ?? undefined,
          role: membership.role
        } satisfies Workspace;
      })
      .filter(Boolean) as Workspace[];

    const currentWorkspace = workspaces[0];

    if (!currentWorkspace) {
      return getEmptySupabaseData("Supabase returned no workspace for this user.");
    }

    const [peopleResult, rolesResult, interactionsResult, mandatesResult, outreachResult, reviewResult] = await Promise.all([
      supabase.from("people").select("*").eq("workspace_id", currentWorkspace.id).order("updated_at", { ascending: false }),
      supabase.from("roles").select("*").eq("workspace_id", currentWorkspace.id).order("is_current", { ascending: false }),
      supabase.from("interactions").select("*").eq("workspace_id", currentWorkspace.id).order("interaction_date", { ascending: false }),
      supabase.from("mandates").select("*").eq("workspace_id", currentWorkspace.id).order("updated_at", { ascending: false }),
      supabase.from("outreach_queue").select("*").eq("workspace_id", currentWorkspace.id).order("due_date", { ascending: true }),
      supabase.from("review_tasks").select("*").eq("workspace_id", currentWorkspace.id).order("updated_at", { ascending: false })
    ]);

    const tableErrors = [
      ["people", peopleResult.error],
      ["roles", rolesResult.error],
      ["interactions", interactionsResult.error],
      ["mandates", mandatesResult.error],
      ["outreach_queue", outreachResult.error],
      ["review_tasks", reviewResult.error]
    ].filter(([, error]) => error) as [string, { message: string }][];

    if (tableErrors.length) {
      return getEmptySupabaseData(
        `Could not read Supabase tables: ${tableErrors.map(([table, error]) => `${table}: ${error.message}`).join("; ")}`
      );
    }

    return {
      people: ((peopleResult.data ?? []) as Parameters<typeof mapPerson>[0][]).map(mapPerson),
      roles: ((rolesResult.data ?? []) as Parameters<typeof mapRole>[0][]).map(mapRole),
      interactions: ((interactionsResult.data ?? []) as Parameters<typeof mapInteraction>[0][]).map(mapInteraction),
      mandates: ((mandatesResult.data ?? []) as Parameters<typeof mapMandate>[0][]).map(mapMandate),
      outreachQueue: ((outreachResult.data ?? []) as Parameters<typeof mapOutreachItem>[0][]).map(mapOutreachItem),
      reviewTasks: ((reviewResult.data ?? []) as Parameters<typeof mapReviewTask>[0][]).map(mapReviewTask),
      workspaces,
      currentWorkspace,
      source: "supabase",
      diagnostic:
        peopleResult.data?.length || mandatesResult.data?.length || reviewResult.data?.length
          ? undefined
          : "Connected to Supabase, but this workspace has no seeded relationship records yet."
    };
  } catch (error) {
    return getEmptySupabaseData(error instanceof Error ? error.message : "Unknown Supabase data loading error.");
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
    workspaces: [{ id: "local", name: "Local Offline Workspace", slug: "local", role: "owner" }],
    currentWorkspace: { id: "local", name: "Local Offline Workspace", slug: "local", role: "owner" },
    source: "mock"
  };
}

function getEmptySupabaseData(diagnostic: string): AppData {
  return {
    people: [],
    roles: [],
    interactions: [],
    mandates: [],
    outreachQueue: [],
    reviewTasks: [],
    workspaces: [],
    source: "supabase",
    diagnostic
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
  avatar_url: string | null;
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
    avatarUrl: row.avatar_url ?? undefined,
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
