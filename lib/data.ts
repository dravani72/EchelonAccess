import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessCard, Interaction, Mandate, OutreachItem, Person, ReviewTask, Role, Workspace } from "@/types/domain";

type SupabaseResult<T = Record<string, unknown>> = Promise<{ data: T[] | null; error: { message: string } | null }>;
type SupabaseSingleResult<T = Record<string, unknown>> = Promise<{ data: T | null; error: { message: string } | null }>;
type SupabaseQuery<T = Record<string, unknown>> = SupabaseResult<T> & {
  limit: (count: number) => SupabaseQuery<T>;
  order: (columnName: string, options?: { ascending?: boolean }) => SupabaseQuery<T>;
};
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
      eq: (column: string, value: string) => SupabaseQuery;
      order: (columnName: string, options?: { ascending?: boolean }) => SupabaseQuery;
      single: () => SupabaseSingleResult;
    };
    insert: (payload: unknown) => Promise<{ error: { message: string } | null }> & {
      select: (columns?: string) => {
        single: () => SupabaseSingleResult;
      };
    };
  };
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
    };
  };
};

const INITIAL_DATA_LIMITS = {
  people: 400,
  roles: 800,
  interactions: 400,
  businessCards: 100,
  mandates: 40,
  outreachQueue: 100,
  reviewTasks: 60
};

const mockSeedIds = new Set<string>();
for (const group of ["0", "2", "3", "4", "5", "6"]) {
  for (const suffix of ["1", "2", "3", "4"]) {
    mockSeedIds.add(`${group}0000000-0000-4000-8000-00000000000${suffix}`);
  }
}

export type AppData = {
  people: Person[];
  roles: Role[];
  interactions: Interaction[];
  businessCards: BusinessCard[];
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
    return getEmptySupabaseData(
      configStatus.isRequired
        ? configStatus.message
        : "Supabase is not configured in this environment. Mock data is disabled, so no local demo records are shown."
    );
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

    const [peopleResult, rolesResult, interactionsResult, businessCardsResult, mandatesResult, outreachResult, reviewResult] = await Promise.all([
      supabase
        .from("people")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("updated_at", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.people),
      supabase
        .from("roles")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("is_current", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.roles),
      supabase
        .from("interactions")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("interaction_date", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.interactions),
      supabase
        .from("business_cards")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("scan_date", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.businessCards),
      supabase
        .from("mandates")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("updated_at", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.mandates),
      supabase
        .from("outreach_queue")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("due_date", { ascending: true })
        .limit(INITIAL_DATA_LIMITS.outreachQueue),
      supabase
        .from("review_tasks")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("updated_at", { ascending: false })
        .limit(INITIAL_DATA_LIMITS.reviewTasks)
    ]);

    const tableErrors = [
      ["people", peopleResult.error],
      ["roles", rolesResult.error],
      ["interactions", interactionsResult.error],
      ["business_cards", businessCardsResult.error],
      ["mandates", mandatesResult.error],
      ["outreach_queue", outreachResult.error],
      ["review_tasks", reviewResult.error]
    ].filter(([, error]) => error) as [string, { message: string }][];

    if (tableErrors.length) {
      return getEmptySupabaseData(
        `Could not read Supabase tables: ${tableErrors.map(([table, error]) => `${table}: ${error.message}`).join("; ")}`
      );
    }

    const realPeople = ((peopleResult.data ?? []) as Parameters<typeof mapPerson>[0][]).map(mapPerson).filter((record) => !record.isMockData);
    const realRoles = ((rolesResult.data ?? []) as Parameters<typeof mapRole>[0][]).map(mapRole).filter((record) => !record.isMockData);
    const realInteractions = ((interactionsResult.data ?? []) as Parameters<typeof mapInteraction>[0][])
      .map(mapInteraction)
      .filter((record) => !record.isMockData);
    const realBusinessCards = ((businessCardsResult.data ?? []) as Parameters<typeof mapBusinessCard>[0][])
      .map((card) => mapBusinessCard(card))
      .filter((record) => !record.isMockData);
    const realMandates = ((mandatesResult.data ?? []) as Parameters<typeof mapMandate>[0][])
      .map(mapMandate)
      .filter((record) => !record.isMockData);
    const realOutreachQueue = ((outreachResult.data ?? []) as Parameters<typeof mapOutreachItem>[0][])
      .map(mapOutreachItem)
      .filter((record) => !record.isMockData);
    const realReviewTasks = ((reviewResult.data ?? []) as Parameters<typeof mapReviewTask>[0][])
      .map(mapReviewTask)
      .filter((record) => !record.isMockData);

    return {
      people: realPeople,
      roles: realRoles,
      interactions: realInteractions,
      businessCards: realBusinessCards,
      mandates: realMandates,
      outreachQueue: realOutreachQueue,
      reviewTasks: realReviewTasks,
      workspaces,
      currentWorkspace,
      source: "supabase",
      diagnostic:
        realPeople.length || realMandates.length || realReviewTasks.length
          ? `Showing a responsive working set: latest ${INITIAL_DATA_LIMITS.people} people, ${INITIAL_DATA_LIMITS.mandates} mandates, and ${INITIAL_DATA_LIMITS.businessCards} card records.`
          : "Connected to Supabase, but this workspace has no relationship records yet."
    };
  } catch (error) {
    return getEmptySupabaseData(error instanceof Error ? error.message : "Unknown Supabase data loading error.");
  }
}

function getEmptySupabaseData(diagnostic: string): AppData {
  return {
    people: [],
    roles: [],
    interactions: [],
    businessCards: [],
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
  opposition: string | null;
  nationality: string | null;
  languages: string[];
  public_private_status: string | null;
  influence_type: string | null;
  access_path: string | null;
  relationship_owner: string | null;
  best_approach: string | null;
  current_authority: string | null;
  historical_authority: string | null;
  sensitivity_level: Person["sensitivityLevel"] | null;
  motivations: string | null;
  constraints: string | null;
  relevant_mandates: string[];
  relevant_geographies: string[];
  relevant_sectors: string[];
  relevant_institutions: string[];
  key_relationships: string | null;
  do_not_discuss: string | null;
  best_next_move: string | null;
  source_confidence: number | null;
  last_verified_date: string | null;
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
  const sourceConfidence = coerceNumber(row.source_confidence);

  return {
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    honorific: row.honorific ?? undefined,
    aliases: coerceStringArray(row.aliases),
    notes: row.notes ?? undefined,
    opposition: row.opposition ?? undefined,
    nationality: row.nationality ?? undefined,
    languages: coerceStringArray(row.languages),
    publicPrivateStatus: row.public_private_status ?? undefined,
    influenceType: row.influence_type ?? undefined,
    accessPath: row.access_path ?? undefined,
    relationshipOwner: row.relationship_owner ?? undefined,
    bestApproach: row.best_approach ?? undefined,
    currentAuthority: row.current_authority ?? undefined,
    historicalAuthority: row.historical_authority ?? undefined,
    sensitivityLevel: row.sensitivity_level ?? undefined,
    motivations: row.motivations ?? undefined,
    constraints: row.constraints ?? undefined,
    relevantMandates: coerceStringArray(row.relevant_mandates),
    relevantGeographies: coerceStringArray(row.relevant_geographies),
    relevantSectors: coerceStringArray(row.relevant_sectors),
    relevantInstitutions: coerceStringArray(row.relevant_institutions),
    keyRelationships: row.key_relationships ?? undefined,
    doNotDiscuss: row.do_not_discuss ?? undefined,
    bestNextMove: row.best_next_move ?? undefined,
    sourceConfidence: sourceConfidence ?? undefined,
    lastVerifiedDate: row.last_verified_date ?? undefined,
    relationshipStrength: clampStrength(row.relationship_strength),
    trustLevel: row.trust_level ?? undefined,
    warmthStatus: row.warmth_status,
    currentTitle: row.current_title ?? "Unknown role",
    currentOrganization: row.current_organization ?? "Unknown organization",
    avatarUrl: row.avatar_url ?? undefined,
    lastInteraction: row.last_interaction ?? "No interaction",
    geography: row.geography ?? "Unknown",
    sectorTags: coerceStringArray(row.sector_tags),
    sourceCount: coerceInteger(row.source_count),
    mandateMatches: coerceInteger(row.mandate_matches),
    reviewStatus: row.review_status,
    isMockData: isMockSeedId(row.id)
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
    confidence: coerceNumber(row.confidence) ?? 0,
    sourceLabel: row.source_label,
    isMockData: isMockSeedId(row.id)
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
    confidence: coerceNumber(row.confidence) ?? 0,
    sourceLabel: row.source_label,
    isMockData: isMockSeedId(row.id)
  };
}

function mapBusinessCard(
  row: {
    id: string;
    person_id: string | null;
    image_url: string | null;
    raw_ocr_text: string | null;
    scan_date: string;
    estimated_card_date: string | null;
    source_event: string | null;
    confidence: number;
    review_status: BusinessCard["reviewStatus"];
  },
  signedUrl?: string
): BusinessCard {
  return {
    id: row.id,
    personId: row.person_id ?? undefined,
    imagePath: row.image_url ?? undefined,
    imageUrl: signedUrl,
    rawOcrText: row.raw_ocr_text ?? undefined,
    scanDate: row.scan_date,
    estimatedCardDate: row.estimated_card_date ?? undefined,
    sourceEvent: row.source_event ?? undefined,
    confidence: coerceNumber(row.confidence) ?? 0,
    reviewStatus: row.review_status,
    isMockData: isMockSeedId(row.id)
  };
}

function mapMandate(row: {
  id: string;
  client_name: string;
  title: string;
  objective: string;
  mandate_category: string | null;
  deal_type: string | null;
  ask_type: string | null;
  transaction_type: string | null;
  client_profile: string | null;
  sponsor_profile: string | null;
  sector: string | null;
  geography: string[];
  jurisdiction: string[];
  target_counterparty_types: string[];
  desired_counterparties: string[];
  forbidden_contacts: string[];
  capital_type: string | null;
  capital_stack: string | null;
  target_amount: string | null;
  minimum_ticket: string | null;
  currency: string | null;
  economics: string | null;
  fee_model: string | null;
  transaction_stage: string | null;
  timeline: string | null;
  urgency: Mandate["urgency"] | null;
  decision_deadline: string | null;
  close_target_date: string | null;
  regulatory_regime: string | null;
  compliance_requirements: string | null;
  sanctions_exposure: string | null;
  political_exposure: string | null;
  procurement_process: string | null;
  government_touchpoints: string[];
  required_approvals: string[];
  decision_makers: string[];
  gatekeepers: string[];
  influencers: string[];
  buyer_universe: string[];
  investor_universe: string[];
  strategic_partners: string[];
  relationship_thesis: string | null;
  access_strategy: string | null;
  outreach_angle: string | null;
  value_proposition: string | null;
  proof_points: string[];
  materials_required: string[];
  diligence_requirements: string[];
  data_room_status: string | null;
  confidentiality_level: Mandate["confidentialityLevel"] | null;
  conflict_constraints: string | null;
  competitive_landscape: string | null;
  incumbent_relationships: string | null;
  risks: string | null;
  blockers: string | null;
  open_questions: string[];
  success_criteria: string[];
  disqualification_criteria: string[];
  next_milestone: string | null;
  owner: string | null;
  priority: Mandate["priority"] | null;
  source_confidence: number | null;
  last_reviewed_date: string | null;
  tags: string[];
  notes: string | null;
  status: Mandate["status"];
  relevant_contacts: number;
  next_action: string | null;
}): Mandate {
  const sourceConfidence = coerceNumber(row.source_confidence);

  return {
    id: row.id,
    clientName: row.client_name,
    title: row.title,
    objective: row.objective,
    mandateCategory: row.mandate_category ?? undefined,
    dealType: row.deal_type ?? undefined,
    askType: row.ask_type ?? undefined,
    transactionType: row.transaction_type ?? undefined,
    clientProfile: row.client_profile ?? undefined,
    sponsorProfile: row.sponsor_profile ?? undefined,
    sector: row.sector ?? undefined,
    geography: coerceStringArray(row.geography),
    jurisdiction: coerceStringArray(row.jurisdiction),
    targetCounterpartyTypes: coerceStringArray(row.target_counterparty_types),
    desiredCounterparties: coerceStringArray(row.desired_counterparties),
    forbiddenContacts: coerceStringArray(row.forbidden_contacts),
    capitalType: row.capital_type ?? undefined,
    capitalStack: row.capital_stack ?? undefined,
    targetAmount: row.target_amount ?? undefined,
    minimumTicket: row.minimum_ticket ?? undefined,
    currency: row.currency ?? undefined,
    economics: row.economics ?? undefined,
    feeModel: row.fee_model ?? undefined,
    transactionStage: row.transaction_stage ?? undefined,
    timeline: row.timeline ?? undefined,
    urgency: row.urgency ?? undefined,
    decisionDeadline: row.decision_deadline ?? undefined,
    closeTargetDate: row.close_target_date ?? undefined,
    regulatoryRegime: row.regulatory_regime ?? undefined,
    complianceRequirements: row.compliance_requirements ?? undefined,
    sanctionsExposure: row.sanctions_exposure ?? undefined,
    politicalExposure: row.political_exposure ?? undefined,
    procurementProcess: row.procurement_process ?? undefined,
    governmentTouchpoints: coerceStringArray(row.government_touchpoints),
    requiredApprovals: coerceStringArray(row.required_approvals),
    decisionMakers: coerceStringArray(row.decision_makers),
    gatekeepers: coerceStringArray(row.gatekeepers),
    influencers: coerceStringArray(row.influencers),
    buyerUniverse: coerceStringArray(row.buyer_universe),
    investorUniverse: coerceStringArray(row.investor_universe),
    strategicPartners: coerceStringArray(row.strategic_partners),
    relationshipThesis: row.relationship_thesis ?? undefined,
    accessStrategy: row.access_strategy ?? undefined,
    outreachAngle: row.outreach_angle ?? undefined,
    valueProposition: row.value_proposition ?? undefined,
    proofPoints: coerceStringArray(row.proof_points),
    materialsRequired: coerceStringArray(row.materials_required),
    diligenceRequirements: coerceStringArray(row.diligence_requirements),
    dataRoomStatus: row.data_room_status ?? undefined,
    confidentialityLevel: row.confidentiality_level ?? undefined,
    conflictConstraints: row.conflict_constraints ?? undefined,
    competitiveLandscape: row.competitive_landscape ?? undefined,
    incumbentRelationships: row.incumbent_relationships ?? undefined,
    risks: row.risks ?? undefined,
    blockers: row.blockers ?? undefined,
    openQuestions: coerceStringArray(row.open_questions),
    successCriteria: coerceStringArray(row.success_criteria),
    disqualificationCriteria: coerceStringArray(row.disqualification_criteria),
    nextMilestone: row.next_milestone ?? undefined,
    owner: row.owner ?? undefined,
    priority: row.priority ?? undefined,
    sourceConfidence: sourceConfidence ?? undefined,
    lastReviewedDate: row.last_reviewed_date ?? undefined,
    tags: coerceStringArray(row.tags),
    notes: row.notes ?? undefined,
    status: row.status,
    relevantContacts: coerceInteger(row.relevant_contacts),
    nextAction: row.next_action ?? "Define next action",
    isMockData: isMockSeedId(row.id)
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
    status: row.status,
    isMockData: isMockSeedId(row.id)
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
    status: row.status,
    isMockData: isMockSeedId(row.id)
  };
}

function isMockSeedId(id: string) {
  return mockSeedIds.has(id) || id.startsWith("p-") || id.startsWith("r-") || id.startsWith("i-") || id.startsWith("m-") || id.startsWith("q-") || id.startsWith("t-");
}

function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function coerceNumber(value: unknown) {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function coerceInteger(value: unknown) {
  return Math.max(0, Math.trunc(coerceNumber(value) ?? 0));
}

function clampStrength(value: number): Person["relationshipStrength"] {
  const numericValue = coerceNumber(value) ?? 1;
  if (numericValue >= 5) return 5;
  if (numericValue <= 1) return 1;
  return Math.trunc(numericValue) as Person["relationshipStrength"];
}
