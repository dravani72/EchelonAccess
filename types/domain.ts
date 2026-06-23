export type RelationshipStrength = 1 | 2 | 3 | 4 | 5;

export type Person = {
  id: string;
  isMockData?: boolean;
  canonicalName: string;
  displayName: string;
  honorific?: string;
  aliases: string[];
  notes?: string;
  opposition?: string;
  nationality?: string;
  languages?: string[];
  publicPrivateStatus?: string;
  influenceType?: string;
  accessPath?: string;
  relationshipOwner?: string;
  bestApproach?: string;
  currentAuthority?: string;
  historicalAuthority?: string;
  sensitivityLevel?: "low" | "moderate" | "high" | "sensitive";
  motivations?: string;
  constraints?: string;
  relevantMandates?: string[];
  relevantGeographies?: string[];
  relevantSectors?: string[];
  relevantInstitutions?: string[];
  keyRelationships?: string;
  doNotDiscuss?: string;
  bestNextMove?: string;
  sourceConfidence?: number;
  lastVerifiedDate?: string;
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
  isMockData?: boolean;
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
  isMockData?: boolean;
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
  isMockData?: boolean;
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
  isMockData?: boolean;
  clientName: string;
  title: string;
  objective: string;
  mandateCategory?: string;
  dealType?: string;
  askType?: string;
  transactionType?: string;
  clientProfile?: string;
  sponsorProfile?: string;
  sector?: string;
  geography?: string[];
  jurisdiction?: string[];
  targetCounterpartyTypes?: string[];
  desiredCounterparties?: string[];
  forbiddenContacts?: string[];
  capitalType?: string;
  capitalStack?: string;
  targetAmount?: string;
  minimumTicket?: string;
  currency?: string;
  economics?: string;
  feeModel?: string;
  transactionStage?: string;
  timeline?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  decisionDeadline?: string;
  closeTargetDate?: string;
  regulatoryRegime?: string;
  complianceRequirements?: string;
  sanctionsExposure?: string;
  politicalExposure?: string;
  procurementProcess?: string;
  governmentTouchpoints?: string[];
  requiredApprovals?: string[];
  decisionMakers?: string[];
  gatekeepers?: string[];
  influencers?: string[];
  buyerUniverse?: string[];
  investorUniverse?: string[];
  strategicPartners?: string[];
  relationshipThesis?: string;
  accessStrategy?: string;
  outreachAngle?: string;
  valueProposition?: string;
  proofPoints?: string[];
  materialsRequired?: string[];
  diligenceRequirements?: string[];
  dataRoomStatus?: string;
  confidentialityLevel?: "standard" | "confidential" | "highly_confidential" | "restricted";
  conflictConstraints?: string;
  competitiveLandscape?: string;
  incumbentRelationships?: string;
  risks?: string;
  blockers?: string;
  openQuestions?: string[];
  successCriteria?: string[];
  disqualificationCriteria?: string[];
  nextMilestone?: string;
  owner?: string;
  priority?: "low" | "medium" | "high" | "critical";
  sourceConfidence?: number;
  lastReviewedDate?: string;
  tags?: string[];
  notes?: string;
  status: "draft" | "researching" | "active" | "paused" | "completed" | "dead";
  relevantContacts: number;
  nextAction: string;
};

export type OutreachItem = {
  id: string;
  isMockData?: boolean;
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
  isMockData?: boolean;
  title: string;
  detail: string;
  status: "needs_review" | "suggested" | "stale" | "sensitive";
};

export type BusinessCard = {
  id: string;
  isMockData?: boolean;
  personId?: string;
  imagePath?: string;
  imageUrl?: string;
  rawOcrText?: string;
  scanDate: string;
  estimatedCardDate?: string;
  sourceEvent?: string;
  confidence: number;
  reviewStatus: "unreviewed" | "reviewed" | "needs_attention" | "merged";
};

export type Workspace = {
  id: string;
  name: string;
  slug?: string;
  role?: "owner" | "admin" | "member" | "viewer";
};
