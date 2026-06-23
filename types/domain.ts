export type RelationshipStrength = 1 | 2 | 3 | 4 | 5;

export type Person = {
  id: string;
  canonicalName: string;
  displayName: string;
  honorific?: string;
  aliases: string[];
  notes?: string;
  relationshipStrength: RelationshipStrength;
  trustLevel?: "unknown" | "low" | "moderate" | "high" | "sensitive";
  warmthStatus: "cold" | "weak" | "known" | "warm" | "direct";
  currentTitle: string;
  currentOrganization: string;
  avatarUrl?: string;
  lastInteraction: string;
  geography: string;
  sectorTags: string[];
  sourceCount: number;
  mandateMatches: number;
  reviewStatus: "verified" | "needs_review" | "possible_duplicate";
};

export type Organization = {
  id: string;
  name: string;
  normalizedName: string;
  type:
    | "company"
    | "government"
    | "ngo"
    | "fund"
    | "embassy"
    | "university"
    | "law_firm"
    | "media"
    | "cultural"
    | "other";
  sector?: string;
  country?: string;
  city?: string;
  website?: string;
  description?: string;
  tags: string[];
};

export type Role = {
  id: string;
  personId: string;
  organizationName: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  confidence: number;
  sourceLabel: string;
};

export type Interaction = {
  id: string;
  personId?: string;
  organizationId?: string;
  mandateId?: string;
  date: string;
  type:
    | "meeting"
    | "email"
    | "call"
    | "introduction"
    | "event"
    | "proposal"
    | "note"
    | "follow_up"
    | "other";
  summary: string;
  outcome?: string;
  nextStep?: string;
  confidence: number;
  sourceLabel: string;
};

export type Mandate = {
  id: string;
  clientName: string;
  title: string;
  objective: string;
  sector?: string;
  geography?: string[];
  status: "draft" | "researching" | "active" | "paused" | "completed" | "dead";
  relevantContacts: number;
  nextAction: string;
};

export type OutreachItem = {
  id: string;
  personName: string;
  mandateTitle: string;
  reason: string;
  channel: "email" | "call" | "intro_request";
  relationshipStrength: RelationshipStrength;
  riskLevel: "low" | "medium" | "high" | "unknown";
  dueDate: string;
  status:
    | "draft_needed"
    | "draft_ready"
    | "awaiting_approval"
    | "sent"
    | "follow_up_needed"
    | "paused"
    | "closed";
};

export type ReviewTask = {
  id: string;
  title: string;
  detail: string;
  status: "needs_review" | "suggested" | "stale" | "sensitive";
};

export type Workspace = {
  id: string;
  name: string;
  slug?: string;
  role?: "owner" | "admin" | "member" | "viewer";
};
