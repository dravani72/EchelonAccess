import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Mandate } from "@/types/domain";

const getSupabase = () => createSupabaseBrowserClient() as any;

type CreateMandateInput = {
  workspaceId: string;
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
  urgency?: Mandate["urgency"] | "";
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
  confidentialityLevel?: Mandate["confidentialityLevel"] | "";
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
  priority?: Mandate["priority"] | "";
  sourceConfidence?: number | null;
  lastReviewedDate?: string;
  tags?: string[];
  status?: Mandate["status"];
  nextAction?: string;
  notes?: string;
};

export async function createMandate(input: CreateMandateInput) {
  const supabase = getSupabase();
  const clientName = input.clientName.trim();
  const title = input.title.trim();
  const objective = input.objective.trim();

  if (!clientName) {
    throw new Error("Client or sponsor name is required.");
  }

  if (!title) {
    throw new Error("Mandate title is required.");
  }

  if (!objective) {
    throw new Error("Mandate objective is required.");
  }

  const { data: mandate, error } = await supabase
    .from("mandates")
    .insert({
      workspace_id: input.workspaceId,
      client_name: clientName,
      title,
      objective,
      mandate_category: cleanText(input.mandateCategory),
      deal_type: cleanText(input.dealType),
      ask_type: cleanText(input.askType),
      transaction_type: cleanText(input.transactionType),
      client_profile: cleanText(input.clientProfile),
      sponsor_profile: cleanText(input.sponsorProfile),
      sector: cleanText(input.sector),
      geography: cleanList(input.geography),
      jurisdiction: cleanList(input.jurisdiction),
      target_counterparty_types: cleanList(input.targetCounterpartyTypes),
      desired_counterparties: cleanList(input.desiredCounterparties),
      forbidden_contacts: cleanList(input.forbiddenContacts),
      capital_type: cleanText(input.capitalType),
      capital_stack: cleanText(input.capitalStack),
      target_amount: cleanText(input.targetAmount),
      minimum_ticket: cleanText(input.minimumTicket),
      currency: cleanText(input.currency),
      economics: cleanText(input.economics),
      fee_model: cleanText(input.feeModel),
      transaction_stage: cleanText(input.transactionStage),
      timeline: cleanText(input.timeline),
      urgency: input.urgency || null,
      decision_deadline: cleanDate(input.decisionDeadline),
      close_target_date: cleanDate(input.closeTargetDate),
      regulatory_regime: cleanText(input.regulatoryRegime),
      compliance_requirements: cleanText(input.complianceRequirements),
      sanctions_exposure: cleanText(input.sanctionsExposure),
      political_exposure: cleanText(input.politicalExposure),
      procurement_process: cleanText(input.procurementProcess),
      government_touchpoints: cleanList(input.governmentTouchpoints),
      required_approvals: cleanList(input.requiredApprovals),
      decision_makers: cleanList(input.decisionMakers),
      gatekeepers: cleanList(input.gatekeepers),
      influencers: cleanList(input.influencers),
      buyer_universe: cleanList(input.buyerUniverse),
      investor_universe: cleanList(input.investorUniverse),
      strategic_partners: cleanList(input.strategicPartners),
      relationship_thesis: cleanText(input.relationshipThesis),
      access_strategy: cleanText(input.accessStrategy),
      outreach_angle: cleanText(input.outreachAngle),
      value_proposition: cleanText(input.valueProposition),
      proof_points: cleanList(input.proofPoints),
      materials_required: cleanList(input.materialsRequired),
      diligence_requirements: cleanList(input.diligenceRequirements),
      data_room_status: cleanText(input.dataRoomStatus),
      confidentiality_level: input.confidentialityLevel || null,
      conflict_constraints: cleanText(input.conflictConstraints),
      competitive_landscape: cleanText(input.competitiveLandscape),
      incumbent_relationships: cleanText(input.incumbentRelationships),
      risks: cleanText(input.risks),
      blockers: cleanText(input.blockers),
      open_questions: cleanList(input.openQuestions),
      success_criteria: cleanList(input.successCriteria),
      disqualification_criteria: cleanList(input.disqualificationCriteria),
      next_milestone: cleanText(input.nextMilestone),
      owner: cleanText(input.owner),
      priority: input.priority || null,
      source_confidence: input.sourceConfidence ?? null,
      last_reviewed_date: cleanDate(input.lastReviewedDate),
      tags: cleanList(input.tags),
      status: input.status ?? "draft",
      next_action: cleanText(input.nextAction),
      notes: cleanText(input.notes)
    })
    .select("id")
    .single();

  if (error || !mandate) {
    if (hasMissingMandateColumn(error?.message)) {
      throw new Error("One or more mandate morphology columns are missing from Supabase schema cache. Run supabase/mandate-morphology.sql in Supabase SQL Editor.");
    }

    throw new Error(error?.message ?? "Could not create mandate.");
  }

  return mandate.id;
}

function cleanText(value?: string) {
  return value?.trim() || null;
}

function cleanDate(value?: string) {
  return value?.trim() || null;
}

function cleanList(values?: string[]) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function hasMissingMandateColumn(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return [
    "mandate_category",
    "deal_type",
    "ask_type",
    "target_counterparty_types",
    "desired_counterparties",
    "relationship_thesis",
    "access_strategy",
    "conflict_constraints",
    "disqualification_criteria"
  ].some((column) => normalized.includes(column));
}
