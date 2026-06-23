"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import {
  askTypeOptions,
  capitalTypeOptions,
  confidentialityOptions,
  counterpartyTypeOptions,
  dataRoomStatusOptions,
  dealTypeOptions,
  mandateCategoryOptions,
  mandateStatusOptions,
  priorityOptions,
  transactionStageOptions,
  urgencyOptions
} from "@/lib/mandate-options";
import { geographyOptions, sectorOptions } from "@/lib/intelligence-options";
import { createMandate } from "@/lib/supabase/mandate-actions";
import type { Mandate } from "@/types/domain";
import { GitBranch, Plus } from "lucide-react";

type MandateFormState = {
  clientName: string;
  title: string;
  objective: string;
  mandateCategory: string;
  dealType: string;
  askType: string;
  transactionType: string;
  clientProfile: string;
  sponsorProfile: string;
  sector: string;
  geography: string;
  jurisdiction: string;
  targetCounterpartyTypes: string;
  desiredCounterparties: string;
  forbiddenContacts: string;
  capitalType: string;
  capitalStack: string;
  targetAmount: string;
  minimumTicket: string;
  currency: string;
  economics: string;
  feeModel: string;
  transactionStage: string;
  timeline: string;
  urgency: "" | NonNullable<Mandate["urgency"]>;
  decisionDeadline: string;
  closeTargetDate: string;
  regulatoryRegime: string;
  complianceRequirements: string;
  sanctionsExposure: string;
  politicalExposure: string;
  procurementProcess: string;
  governmentTouchpoints: string;
  requiredApprovals: string;
  decisionMakers: string;
  gatekeepers: string;
  influencers: string;
  buyerUniverse: string;
  investorUniverse: string;
  strategicPartners: string;
  relationshipThesis: string;
  accessStrategy: string;
  outreachAngle: string;
  valueProposition: string;
  proofPoints: string;
  materialsRequired: string;
  diligenceRequirements: string;
  dataRoomStatus: string;
  confidentialityLevel: "" | NonNullable<Mandate["confidentialityLevel"]>;
  conflictConstraints: string;
  competitiveLandscape: string;
  incumbentRelationships: string;
  risks: string;
  blockers: string;
  openQuestions: string;
  successCriteria: string;
  disqualificationCriteria: string;
  nextMilestone: string;
  owner: string;
  priority: "" | NonNullable<Mandate["priority"]>;
  sourceConfidence: string;
  lastReviewedDate: string;
  tags: string;
  status: Mandate["status"];
  nextAction: string;
  notes: string;
};

const emptyMandate: MandateFormState = {
  clientName: "",
  title: "",
  objective: "",
  mandateCategory: "",
  dealType: "",
  askType: "",
  transactionType: "",
  clientProfile: "",
  sponsorProfile: "",
  sector: "",
  geography: "",
  jurisdiction: "",
  targetCounterpartyTypes: "",
  desiredCounterparties: "",
  forbiddenContacts: "",
  capitalType: "",
  capitalStack: "",
  targetAmount: "",
  minimumTicket: "",
  currency: "",
  economics: "",
  feeModel: "",
  transactionStage: "",
  timeline: "",
  urgency: "",
  decisionDeadline: "",
  closeTargetDate: "",
  regulatoryRegime: "",
  complianceRequirements: "",
  sanctionsExposure: "",
  politicalExposure: "",
  procurementProcess: "",
  governmentTouchpoints: "",
  requiredApprovals: "",
  decisionMakers: "",
  gatekeepers: "",
  influencers: "",
  buyerUniverse: "",
  investorUniverse: "",
  strategicPartners: "",
  relationshipThesis: "",
  accessStrategy: "",
  outreachAngle: "",
  valueProposition: "",
  proofPoints: "",
  materialsRequired: "",
  diligenceRequirements: "",
  dataRoomStatus: "",
  confidentialityLevel: "",
  conflictConstraints: "",
  competitiveLandscape: "",
  incumbentRelationships: "",
  risks: "",
  blockers: "",
  openQuestions: "",
  successCriteria: "",
  disqualificationCriteria: "",
  nextMilestone: "",
  owner: "",
  priority: "",
  sourceConfidence: "",
  lastReviewedDate: "",
  tags: "",
  status: "draft",
  nextAction: "",
  notes: ""
};

export function MandateIntake({ workspaceId, source }: { workspaceId?: string; source: "supabase" | "mock" }) {
  const router = useRouter();
  const [mandate, setMandate] = useState<MandateFormState>(emptyMandate);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const isSupabase = source === "supabase" && Boolean(workspaceId);

  function updateField<K extends keyof MandateFormState>(field: K, value: MandateFormState[K]) {
    setMandate({ ...mandate, [field]: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!isSupabase || !workspaceId) {
      setError("Supabase workspace is required before saving mandate records.");
      return;
    }

    try {
      setStatus("Saving mandate...");
      await createMandate({
        workspaceId,
        ...serializeMandate(mandate)
      });
      setMandate(emptyMandate);
      setStatus("Mandate saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save mandate.");
      setStatus("");
    }
  }

  return (
    <section className="panel" id="define-mandate">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Define Mandate</h2>
          <div className="section-kicker">Capture scope, depth, authority path, counterparties, constraints, evidence, and next action.</div>
        </div>
        <Badge tone="purple">Structured mandate intake</Badge>
      </div>
      <div className="panel-body">
        <div className="intake-layout">
          <div className="intake-detail">
            <div className="badge-row">
              <Badge tone="purple">Mandate</Badge>
              <Badge tone="blue">SQL-ready scope</Badge>
            </div>
            <p>
              Use required fields for identity and objective. Everything else is optional but structured so project type, counterparty
              universe, access path, constraints, and evidence can be queried consistently across industries.
            </p>
          </div>

          <form className="manual-form" onSubmit={handleSubmit}>
            <div className="intelligence-capture">
              <div className="section-kicker">Core directive</div>
              <div className="record-editor-grid intelligence-form-grid">
                <TextField
                  label="Client / sponsor"
                  onChange={(value) => updateField("clientName", value)}
                  placeholder="Client, sponsor, principal, or institution"
                  required
                  value={mandate.clientName}
                />
                <TextField
                  label="Mandate title"
                  onChange={(value) => updateField("title", value)}
                  placeholder="Strategic capital path, market entry, partner search..."
                  required
                  value={mandate.title}
                />
                <SelectField
                  label="Status"
                  onChange={(value) => updateField("status", value as MandateFormState["status"])}
                  options={mandateStatusOptions}
                  value={mandate.status}
                />
                <SelectField
                  label="Priority"
                  onChange={(value) => updateField("priority", value as MandateFormState["priority"])}
                  options={priorityOptions}
                  value={mandate.priority}
                />
                <TextField
                  label="Owner"
                  onChange={(value) => updateField("owner", value)}
                  placeholder="Internal owner"
                  value={mandate.owner}
                />
              </div>
              <TextAreaField
                label="Objective"
                onChange={(value) => updateField("objective", value)}
                placeholder="Define the consequential goal, why it matters, and what must become possible."
                required
                value={mandate.objective}
              />
            </div>

            <MandateSection title="Relative Scope">
              <div className="record-editor-grid intelligence-form-grid">
                <SelectField
                  label="Category"
                  onChange={(value) => updateField("mandateCategory", value)}
                  options={mandateCategoryOptions}
                  value={mandate.mandateCategory}
                />
                <SelectField
                  label="Deal type"
                  onChange={(value) => updateField("dealType", value)}
                  options={dealTypeOptions}
                  value={mandate.dealType}
                />
                <SelectField
                  label="Ask type"
                  onChange={(value) => updateField("askType", value)}
                  options={askTypeOptions}
                  value={mandate.askType}
                />
                <TextField
                  label="Transaction"
                  onChange={(value) => updateField("transactionType", value)}
                  placeholder="Acquisition, concession, bilateral program..."
                  value={mandate.transactionType}
                />
                <SelectField
                  label="Stage"
                  onChange={(value) => updateField("transactionStage", value)}
                  options={transactionStageOptions}
                  value={mandate.transactionStage}
                />
                <SelectField
                  label="Sector"
                  onChange={(value) => updateField("sector", value)}
                  options={[{ value: "", label: "Not set" }, ...sectorOptions.map((option) => ({ value: option, label: option }))]}
                  value={mandate.sector}
                />
                <MultiSelectField
                  label="Geographies"
                  onChange={(value) => updateField("geography", value)}
                  options={geographyOptions}
                  value={mandate.geography}
                />
                <TextField
                  label="Jurisdictions"
                  onChange={(value) => updateField("jurisdiction", value)}
                  placeholder="Countries, states, cities, agencies"
                  value={mandate.jurisdiction}
                />
                <TextField
                  label="Timeline"
                  onChange={(value) => updateField("timeline", value)}
                  placeholder="30 days, Q3, before board meeting..."
                  value={mandate.timeline}
                />
                <SelectField
                  label="Urgency"
                  onChange={(value) => updateField("urgency", value as MandateFormState["urgency"])}
                  options={urgencyOptions}
                  value={mandate.urgency}
                />
                <DateField label="Decision deadline" onChange={(value) => updateField("decisionDeadline", value)} value={mandate.decisionDeadline} />
                <DateField label="Close target" onChange={(value) => updateField("closeTargetDate", value)} value={mandate.closeTargetDate} />
              </div>
            </MandateSection>

            <MandateSection title="Capital And Economics">
              <div className="record-editor-grid intelligence-form-grid">
                <TextField
                  label="Client profile"
                  onChange={(value) => updateField("clientProfile", value)}
                  placeholder="Sponsor, issuer, buyer, ministry, foundation..."
                  value={mandate.clientProfile}
                />
                <TextField
                  label="Sponsor profile"
                  onChange={(value) => updateField("sponsorProfile", value)}
                  placeholder="Track record, credibility, constraints"
                  value={mandate.sponsorProfile}
                />
                <SelectField
                  label="Capital type"
                  onChange={(value) => updateField("capitalType", value)}
                  options={capitalTypeOptions}
                  value={mandate.capitalType}
                />
                <TextField
                  label="Capital stack"
                  onChange={(value) => updateField("capitalStack", value)}
                  placeholder="Senior debt, mezzanine, equity..."
                  value={mandate.capitalStack}
                />
                <TextField label="Target amount" onChange={(value) => updateField("targetAmount", value)} placeholder="$25M" value={mandate.targetAmount} />
                <TextField label="Minimum ticket" onChange={(value) => updateField("minimumTicket", value)} placeholder="$1M" value={mandate.minimumTicket} />
                <TextField label="Currency" onChange={(value) => updateField("currency", value)} placeholder="USD, EUR, GBP" value={mandate.currency} />
                <TextField label="Economics" onChange={(value) => updateField("economics", value)} placeholder="Fees, carry, spread..." value={mandate.economics} />
                <TextField label="Fee model" onChange={(value) => updateField("feeModel", value)} placeholder="Retainer, success fee..." value={mandate.feeModel} />
              </div>
            </MandateSection>

            <MandateSection title="Counterparty Universe">
              <div className="record-editor-grid intelligence-form-grid">
                <MultiSelectField
                  label="Counterparty types"
                  onChange={(value) => updateField("targetCounterpartyTypes", value)}
                  options={counterpartyTypeOptions}
                  value={mandate.targetCounterpartyTypes}
                />
                <TextField
                  label="Desired counterparties"
                  onChange={(value) => updateField("desiredCounterparties", value)}
                  placeholder="Specific organizations or principals"
                  value={mandate.desiredCounterparties}
                />
                <TextField
                  label="Forbidden contacts"
                  onChange={(value) => updateField("forbiddenContacts", value)}
                  placeholder="Do-not-approach names"
                  value={mandate.forbiddenContacts}
                />
                <TextField label="Buyer universe" onChange={(value) => updateField("buyerUniverse", value)} value={mandate.buyerUniverse} />
                <TextField label="Investor universe" onChange={(value) => updateField("investorUniverse", value)} value={mandate.investorUniverse} />
                <TextField label="Strategic partners" onChange={(value) => updateField("strategicPartners", value)} value={mandate.strategicPartners} />
              </div>
            </MandateSection>

            <MandateSection title="Authority And Access Path">
              <div className="intelligence-text-grid">
                <TextAreaField
                  label="Relationship thesis"
                  onChange={(value) => updateField("relationshipThesis", value)}
                  placeholder="Why this relationship field matters and where mutuality may exist."
                  value={mandate.relationshipThesis}
                />
                <TextAreaField
                  label="Access strategy"
                  onChange={(value) => updateField("accessStrategy", value)}
                  placeholder="Sequence, credible intermediary, permission, timing, and disclosure posture."
                  value={mandate.accessStrategy}
                />
                <TextAreaField
                  label="Outreach angle"
                  onChange={(value) => updateField("outreachAngle", value)}
                  placeholder="The first legitimate reason to engage."
                  value={mandate.outreachAngle}
                />
                <TextAreaField
                  label="Value proposition"
                  onChange={(value) => updateField("valueProposition", value)}
                  placeholder="Why the other side would care."
                  value={mandate.valueProposition}
                />
              </div>
              <div className="record-editor-grid intelligence-form-grid">
                <TextField label="Decision makers" onChange={(value) => updateField("decisionMakers", value)} value={mandate.decisionMakers} />
                <TextField label="Gatekeepers" onChange={(value) => updateField("gatekeepers", value)} value={mandate.gatekeepers} />
                <TextField label="Influencers" onChange={(value) => updateField("influencers", value)} value={mandate.influencers} />
                <TextField
                  label="Government touchpoints"
                  onChange={(value) => updateField("governmentTouchpoints", value)}
                  value={mandate.governmentTouchpoints}
                />
                <TextField label="Required approvals" onChange={(value) => updateField("requiredApprovals", value)} value={mandate.requiredApprovals} />
              </div>
            </MandateSection>

            <MandateSection title="Constraints And Risk">
              <div className="record-editor-grid intelligence-form-grid">
                <TextField label="Regulatory regime" onChange={(value) => updateField("regulatoryRegime", value)} value={mandate.regulatoryRegime} />
                <TextField
                  label="Compliance"
                  onChange={(value) => updateField("complianceRequirements", value)}
                  value={mandate.complianceRequirements}
                />
                <TextField label="Sanctions exposure" onChange={(value) => updateField("sanctionsExposure", value)} value={mandate.sanctionsExposure} />
                <TextField label="Political exposure" onChange={(value) => updateField("politicalExposure", value)} value={mandate.politicalExposure} />
                <TextField label="Procurement" onChange={(value) => updateField("procurementProcess", value)} value={mandate.procurementProcess} />
                <SelectField
                  label="Confidentiality"
                  onChange={(value) => updateField("confidentialityLevel", value as MandateFormState["confidentialityLevel"])}
                  options={confidentialityOptions}
                  value={mandate.confidentialityLevel}
                />
              </div>
              <div className="intelligence-text-grid">
                <TextAreaField label="Conflict constraints" onChange={(value) => updateField("conflictConstraints", value)} value={mandate.conflictConstraints} />
                <TextAreaField label="Risks" onChange={(value) => updateField("risks", value)} value={mandate.risks} />
                <TextAreaField label="Blockers" onChange={(value) => updateField("blockers", value)} value={mandate.blockers} />
                <TextAreaField label="Disqualification criteria" onChange={(value) => updateField("disqualificationCriteria", value)} value={mandate.disqualificationCriteria} />
              </div>
            </MandateSection>

            <MandateSection title="Evidence And Qualification">
              <div className="record-editor-grid intelligence-form-grid">
                <TextField label="Proof points" onChange={(value) => updateField("proofPoints", value)} value={mandate.proofPoints} />
                <TextField label="Materials required" onChange={(value) => updateField("materialsRequired", value)} value={mandate.materialsRequired} />
                <TextField
                  label="Diligence requirements"
                  onChange={(value) => updateField("diligenceRequirements", value)}
                  value={mandate.diligenceRequirements}
                />
                <SelectField
                  label="Data room"
                  onChange={(value) => updateField("dataRoomStatus", value)}
                  options={dataRoomStatusOptions}
                  value={mandate.dataRoomStatus}
                />
                <TextField label="Open questions" onChange={(value) => updateField("openQuestions", value)} value={mandate.openQuestions} />
                <TextField label="Success criteria" onChange={(value) => updateField("successCriteria", value)} value={mandate.successCriteria} />
                <TextField label="Next milestone" onChange={(value) => updateField("nextMilestone", value)} value={mandate.nextMilestone} />
                <TextField label="Next action" onChange={(value) => updateField("nextAction", value)} value={mandate.nextAction} />
                <TextField label="Tags" onChange={(value) => updateField("tags", value)} placeholder="Comma-separated" value={mandate.tags} />
                <TextField
                  label="Confidence"
                  onChange={(value) => updateField("sourceConfidence", value)}
                  placeholder="0-100"
                  type="number"
                  value={mandate.sourceConfidence}
                />
                <DateField label="Last reviewed" onChange={(value) => updateField("lastReviewedDate", value)} value={mandate.lastReviewedDate} />
              </div>
              <div className="intelligence-text-grid">
                <TextAreaField
                  label="Competitive landscape"
                  onChange={(value) => updateField("competitiveLandscape", value)}
                  value={mandate.competitiveLandscape}
                />
                <TextAreaField
                  label="Incumbent relationships"
                  onChange={(value) => updateField("incumbentRelationships", value)}
                  value={mandate.incumbentRelationships}
                />
                <TextAreaField label="Notes" onChange={(value) => updateField("notes", value)} value={mandate.notes} />
              </div>
            </MandateSection>

            {error ? <div className="form-error">{error}</div> : null}
            {status ? <div className="form-notice">{status}</div> : null}
            <button className="button primary" disabled={!isSupabase} type="submit">
              <Plus size={16} />
              Save mandate
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function MandateSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <details className="mandate-morphology" open>
      <summary>
        <span className="badge-row" style={{ display: "inline-flex" }}>
          <GitBranch size={14} />
          {title}
        </span>
      </summary>
      <div className="intelligence-capture" style={{ border: 0, marginTop: 10, padding: 0 }}>
        {children}
      </div>
    </details>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input
        className="text-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function DateField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <TextField label={label} onChange={onChange} type="date" value={value} />;
}

function TextAreaField({
  label,
  onChange,
  placeholder,
  required,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <textarea
        className="text-area"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  const hasLegacyValue = Boolean(value) && !options.some((option) => option.value === value);

  return (
    <label>
      <span className="field-label">{label}</span>
      <select className="text-input" onChange={(event) => onChange(event.target.value)} value={value}>
        {hasLegacyValue ? <option value={value}>Legacy: {value}</option> : null}
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const selected = splitList(value);
  const legacyOptions = selected.filter((item) => !options.includes(item));

  return (
    <label>
      <span className="field-label">{label}</span>
      <select
        className="text-input"
        multiple
        onChange={(event) =>
          onChange(
            Array.from(event.currentTarget.selectedOptions)
              .map((option) => option.value)
              .join(", ")
          )
        }
        value={selected}
      >
        {legacyOptions.map((option) => (
          <option key={option} value={option}>
            Legacy: {option}
          </option>
        ))}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function serializeMandate(mandate: MandateFormState) {
  const confidence = Number(mandate.sourceConfidence);

  return {
    clientName: mandate.clientName,
    title: mandate.title,
    objective: mandate.objective,
    mandateCategory: mandate.mandateCategory,
    dealType: mandate.dealType,
    askType: mandate.askType,
    transactionType: mandate.transactionType,
    clientProfile: mandate.clientProfile,
    sponsorProfile: mandate.sponsorProfile,
    sector: mandate.sector,
    geography: splitList(mandate.geography),
    jurisdiction: splitList(mandate.jurisdiction),
    targetCounterpartyTypes: splitList(mandate.targetCounterpartyTypes),
    desiredCounterparties: splitList(mandate.desiredCounterparties),
    forbiddenContacts: splitList(mandate.forbiddenContacts),
    capitalType: mandate.capitalType,
    capitalStack: mandate.capitalStack,
    targetAmount: mandate.targetAmount,
    minimumTicket: mandate.minimumTicket,
    currency: mandate.currency,
    economics: mandate.economics,
    feeModel: mandate.feeModel,
    transactionStage: mandate.transactionStage,
    timeline: mandate.timeline,
    urgency: mandate.urgency,
    decisionDeadline: mandate.decisionDeadline,
    closeTargetDate: mandate.closeTargetDate,
    regulatoryRegime: mandate.regulatoryRegime,
    complianceRequirements: mandate.complianceRequirements,
    sanctionsExposure: mandate.sanctionsExposure,
    politicalExposure: mandate.politicalExposure,
    procurementProcess: mandate.procurementProcess,
    governmentTouchpoints: splitList(mandate.governmentTouchpoints),
    requiredApprovals: splitList(mandate.requiredApprovals),
    decisionMakers: splitList(mandate.decisionMakers),
    gatekeepers: splitList(mandate.gatekeepers),
    influencers: splitList(mandate.influencers),
    buyerUniverse: splitList(mandate.buyerUniverse),
    investorUniverse: splitList(mandate.investorUniverse),
    strategicPartners: splitList(mandate.strategicPartners),
    relationshipThesis: mandate.relationshipThesis,
    accessStrategy: mandate.accessStrategy,
    outreachAngle: mandate.outreachAngle,
    valueProposition: mandate.valueProposition,
    proofPoints: splitList(mandate.proofPoints),
    materialsRequired: splitList(mandate.materialsRequired),
    diligenceRequirements: splitList(mandate.diligenceRequirements),
    dataRoomStatus: mandate.dataRoomStatus,
    confidentialityLevel: mandate.confidentialityLevel,
    conflictConstraints: mandate.conflictConstraints,
    competitiveLandscape: mandate.competitiveLandscape,
    incumbentRelationships: mandate.incumbentRelationships,
    risks: mandate.risks,
    blockers: mandate.blockers,
    openQuestions: splitList(mandate.openQuestions),
    successCriteria: splitList(mandate.successCriteria),
    disqualificationCriteria: splitList(mandate.disqualificationCriteria),
    nextMilestone: mandate.nextMilestone,
    owner: mandate.owner,
    priority: mandate.priority,
    sourceConfidence: Number.isFinite(confidence) && mandate.sourceConfidence.trim() ? confidence / 100 : null,
    lastReviewedDate: mandate.lastReviewedDate,
    tags: splitList(mandate.tags),
    status: mandate.status,
    nextAction: mandate.nextAction,
    notes: mandate.notes
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
