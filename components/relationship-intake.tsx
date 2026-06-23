"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { createRelationship, stageContactImport } from "@/lib/supabase/relationship-actions";
import { Camera, Contact, FileUp, Plus, Smartphone } from "lucide-react";

const intakeMethods = [
  {
    id: "card",
    label: "Business card photo",
    icon: Camera,
    description: "Upload a card image, preserve the artifact, OCR the text, and review parsed fields before merge."
  },
  {
    id: "mobile",
    label: "Mobile contact transfer",
    icon: Smartphone,
    description: "Import a vCard/contact export from iOS, Android, Google Contacts, or another address book."
  },
  {
    id: "manual",
    label: "Manual entry",
    icon: Contact,
    description: "Create a relationship record by hand when no card or device transfer is available."
  }
] as const;

type IntakeMethod = (typeof intakeMethods)[number]["id"];
type IntelligenceFormState = {
  trustLevel: "" | "unknown" | "low" | "moderate" | "high" | "sensitive";
  opposition: string;
  nationality: string;
  languages: string;
  publicPrivateStatus: string;
  influenceType: string;
  accessPath: string;
  relationshipOwner: string;
  bestApproach: string;
  currentAuthority: string;
  historicalAuthority: string;
  sensitivityLevel: "" | "low" | "moderate" | "high" | "sensitive";
  motivations: string;
  constraints: string;
  relevantMandates: string;
  relevantGeographies: string;
  relevantSectors: string;
  relevantInstitutions: string;
  keyRelationships: string;
  doNotDiscuss: string;
  bestNextMove: string;
  sourceConfidence: string;
  lastVerifiedDate: string;
};

const emptyIntelligence: IntelligenceFormState = {
  trustLevel: "",
  opposition: "",
  nationality: "",
  languages: "",
  publicPrivateStatus: "",
  influenceType: "",
  accessPath: "",
  relationshipOwner: "",
  bestApproach: "",
  currentAuthority: "",
  historicalAuthority: "",
  sensitivityLevel: "",
  motivations: "",
  constraints: "",
  relevantMandates: "",
  relevantGeographies: "",
  relevantSectors: "",
  relevantInstitutions: "",
  keyRelationships: "",
  doNotDiscuss: "",
  bestNextMove: "",
  sourceConfidence: "",
  lastVerifiedDate: ""
};

export function RelationshipIntake({ workspaceId, source }: { workspaceId?: string; source: "supabase" | "mock" }) {
  const router = useRouter();
  const [method, setMethod] = useState<IntakeMethod>("card");
  const [manualName, setManualName] = useState("");
  const [manualOrg, setManualOrg] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [intelligence, setIntelligence] = useState<IntelligenceFormState>(emptyIntelligence);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const isSupabase = source === "supabase" && Boolean(workspaceId);

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!isSupabase || !workspaceId) {
      setError("Supabase workspace is required before saving relationship records.");
      return;
    }

    try {
      setStatus("Saving relationship...");
      await createRelationship({
        workspaceId,
        name: manualName,
        organization: manualOrg,
        title: manualTitle,
        notes: manualNotes,
        ...serializeIntelligence(intelligence),
        cardFile,
        avatarFile
      });
      setManualName("");
      setManualOrg("");
      setManualTitle("");
      setManualNotes("");
      setIntelligence(emptyIntelligence);
      setCardFile(null);
      setAvatarFile(null);
      setStatus("Relationship saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save relationship.");
      setStatus("");
    }
  }

  async function handleContactImport() {
    setError("");
    setStatus("");

    if (!isSupabase || !workspaceId) {
      setError("Supabase workspace is required before saving imports.");
      return;
    }

    if (!contactFile) {
      setError("Choose a contact export file first.");
      return;
    }

    try {
      setStatus("Uploading contact import...");
      await stageContactImport(workspaceId, contactFile);
      setContactFile(null);
      setStatus("Contact import stored for review.");
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload contact import.");
      setStatus("");
    }
  }

  return (
    <section className="panel" id="Add Relationship">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Add Relationship</h2>
          <div className="section-kicker">Choose the source first so every relationship begins with evidence.</div>
        </div>
        <Badge tone="blue">Source-aware intake</Badge>
      </div>
      <div className="panel-body">
        <div className="intake-methods" role="tablist" aria-label="Relationship intake method">
          {intakeMethods.map((item) => (
            <button
              aria-selected={method === item.id}
              className={`intake-method ${method === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setMethod(item.id)}
              role="tab"
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="intake-layout">
          <div className="intake-detail">
            <div className="badge-row">
              <Badge tone={method === "card" ? "amber" : method === "mobile" ? "green" : "blue"}>
                {intakeMethods.find((item) => item.id === method)?.label}
              </Badge>
              <Badge tone="purple">Human review required</Badge>
            </div>
            <p>{intakeMethods.find((item) => item.id === method)?.description}</p>
          </div>

          {method === "card" ? (
            <div className="intake-workflow">
              <label className="upload-zone">
                <FileUp size={24} />
                <span>Drop or choose business card photo</span>
                <small>JPG, PNG, HEIC, or PDF scan</small>
                <input accept="image/*,.pdf" onChange={(event) => setCardFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              {cardFile ? <div className="form-notice">Selected: {cardFile.name}</div> : null}
              <form className="manual-form" onSubmit={handleManualSubmit}>
                <label>
                  <span className="field-label">Person name</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualName(event.target.value)}
                    placeholder="Amelia Hart"
                    value={manualName}
                  />
                </label>
                <label>
                  <span className="field-label">Title</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualTitle(event.target.value)}
                    placeholder="Partner, Strategic Infrastructure"
                    value={manualTitle}
                  />
                </label>
                <label>
                  <span className="field-label">Organization</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualOrg(event.target.value)}
                    placeholder="Northbridge Capital"
                    value={manualOrg}
                  />
                </label>
                <IntelligenceCapture intelligence={intelligence} setIntelligence={setIntelligence} />
                {error ? <div className="form-error">{error}</div> : null}
                {status ? <div className="form-notice">{status}</div> : null}
                <button className="button primary" disabled={!isSupabase} type="submit">
                  <Plus size={16} />
                  Save card-backed relationship
                </button>
              </form>
              <div className="intake-steps">
                <span>OCR text capture</span>
                <span>AI field parsing</span>
                <span>Duplicate suggestion</span>
                <span>User approval</span>
              </div>
            </div>
          ) : null}

          {method === "mobile" ? (
            <div className="intake-workflow">
              <label className="upload-zone">
                <Smartphone size={24} />
                <span>Import mobile contacts</span>
                <small>Upload .vcf, .csv, or exported address book file</small>
                <input accept=".vcf,.csv,text/vcard,text/csv" onChange={(event) => setContactFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              {contactFile ? <div className="form-notice">Selected: {contactFile.name}</div> : null}
              {error ? <div className="form-error">{error}</div> : null}
              {status ? <div className="form-notice">{status}</div> : null}
              <div className="mobile-transfer-grid">
                <button className="button" onClick={handleContactImport} type="button">
                  iOS vCard
                </button>
                <button className="button" onClick={handleContactImport} type="button">
                  Android export
                </button>
                <button className="button" onClick={handleContactImport} type="button">
                  Google Contacts CSV
                </button>
              </div>
            </div>
          ) : null}

          {method === "manual" ? (
            <form className="manual-form" onSubmit={handleManualSubmit}>
              <label>
                <span className="field-label">Person name</span>
                <input
                  className="text-input"
                  onChange={(event) => setManualName(event.target.value)}
                  placeholder="Amelia Hart"
                  value={manualName}
                />
              </label>
              <label>
                <span className="field-label">Organization</span>
                <input
                  className="text-input"
                  onChange={(event) => setManualOrg(event.target.value)}
                  placeholder="Northbridge Capital"
                  value={manualOrg}
                />
              </label>
              <label>
                <span className="field-label">Title</span>
                <input
                  className="text-input"
                  onChange={(event) => setManualTitle(event.target.value)}
                  placeholder="Partner, Strategic Infrastructure"
                  value={manualTitle}
                />
              </label>
              <label>
                <span className="field-label">Avatar or profile image</span>
                <input
                  accept="image/*"
                  className="text-input"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              <IntelligenceCapture intelligence={intelligence} setIntelligence={setIntelligence} />
              <label>
                <span className="field-label">Relationship context</span>
                <textarea
                  className="text-area"
                  onChange={(event) => setManualNotes(event.target.value)}
                  placeholder="How you know them, source, mandate relevance, next step..."
                  value={manualNotes}
                />
              </label>
              {error ? <div className="form-error">{error}</div> : null}
              {status ? <div className="form-notice">{status}</div> : null}
              <button className="button primary" disabled={!isSupabase} type="submit">
                <Plus size={16} />
                Save relationship
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function IntelligenceCapture({
  intelligence,
  setIntelligence
}: {
  intelligence: IntelligenceFormState;
  setIntelligence: (value: IntelligenceFormState) => void;
}) {
  function updateField<K extends keyof IntelligenceFormState>(field: K, value: IntelligenceFormState[K]) {
    setIntelligence({ ...intelligence, [field]: value });
  }

  return (
    <div className="intelligence-capture">
      <div className="section-kicker">Relationship intelligence</div>
      <div className="record-editor-grid intelligence-form-grid">
        <label>
          <span className="field-label">Influence type</span>
          <input
            className="text-input"
            onChange={(event) => updateField("influenceType", event.target.value)}
            placeholder="Gatekeeper, allocator, regulator, introducer..."
            value={intelligence.influenceType}
          />
        </label>
        <label>
          <span className="field-label">Access path</span>
          <input
            className="text-input"
            onChange={(event) => updateField("accessPath", event.target.value)}
            placeholder="Direct, warm intro, chief of staff, event context..."
            value={intelligence.accessPath}
          />
        </label>
        <label>
          <span className="field-label">Relationship owner</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relationshipOwner", event.target.value)}
            placeholder="Internal owner"
            value={intelligence.relationshipOwner}
          />
        </label>
        <label>
          <span className="field-label">Best approach</span>
          <input
            className="text-input"
            onChange={(event) => updateField("bestApproach", event.target.value)}
            placeholder="Formal briefing, dinner, WhatsApp, email..."
            value={intelligence.bestApproach}
          />
        </label>
        <label>
          <span className="field-label">Sensitivity</span>
          <select
            className="text-input"
            onChange={(event) => updateField("sensitivityLevel", event.target.value as IntelligenceFormState["sensitivityLevel"])}
            value={intelligence.sensitivityLevel}
          >
            <option value="">Not set</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </label>
        <label>
          <span className="field-label">Trust level</span>
          <select
            className="text-input"
            onChange={(event) => updateField("trustLevel", event.target.value as IntelligenceFormState["trustLevel"])}
            value={intelligence.trustLevel}
          >
            <option value="">Not set</option>
            <option value="unknown">Unknown</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </label>
        <label>
          <span className="field-label">Nationality</span>
          <input
            className="text-input"
            onChange={(event) => updateField("nationality", event.target.value)}
            placeholder="Country or citizenship context"
            value={intelligence.nationality}
          />
        </label>
        <label>
          <span className="field-label">Languages</span>
          <input
            className="text-input"
            onChange={(event) => updateField("languages", event.target.value)}
            placeholder="English, French, Arabic"
            value={intelligence.languages}
          />
        </label>
        <label>
          <span className="field-label">Public/private status</span>
          <input
            className="text-input"
            onChange={(event) => updateField("publicPrivateStatus", event.target.value)}
            placeholder="Government, private sector, public-private bridge..."
            value={intelligence.publicPrivateStatus}
          />
        </label>
        <label>
          <span className="field-label">Source confidence</span>
          <input
            className="text-input"
            max="100"
            min="0"
            onChange={(event) => updateField("sourceConfidence", event.target.value)}
            placeholder="0-100"
            type="number"
            value={intelligence.sourceConfidence}
          />
        </label>
        <label>
          <span className="field-label">Last verified</span>
          <input
            className="text-input"
            onChange={(event) => updateField("lastVerifiedDate", event.target.value)}
            type="date"
            value={intelligence.lastVerifiedDate}
          />
        </label>
      </div>
      <div className="intelligence-text-grid">
        <label>
          <span className="field-label">Current authority</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("currentAuthority", event.target.value)}
            placeholder="What they can approve, block, introduce, validate, or influence now..."
            value={intelligence.currentAuthority}
          />
        </label>
        <label>
          <span className="field-label">Historical authority</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("historicalAuthority", event.target.value)}
            placeholder="Former roles, postings, or institutional authority that still matters..."
            value={intelligence.historicalAuthority}
          />
        </label>
        <label>
          <span className="field-label">Motivations</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("motivations", event.target.value)}
            placeholder="Strategic priorities, reputation interests, career incentives, political incentives..."
            value={intelligence.motivations}
          />
        </label>
        <label>
          <span className="field-label">Constraints</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("constraints", event.target.value)}
            placeholder="Compliance limits, procurement restrictions, conflicts, public narrative sensitivity..."
            value={intelligence.constraints}
          />
        </label>
        <label>
          <span className="field-label">Opposition / blockers</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("opposition", event.target.value)}
            placeholder="Known opponents, rival interests, political resistance, procurement concerns..."
            value={intelligence.opposition}
          />
        </label>
        <label>
          <span className="field-label">Key relationships</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("keyRelationships", event.target.value)}
            placeholder="Known allies, principals, assistants, rivals, sponsors, protégés..."
            value={intelligence.keyRelationships}
          />
        </label>
        <label>
          <span className="field-label">Do not discuss</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("doNotDiscuss", event.target.value)}
            placeholder="Topics, counterparties, asks, or sensitivities to avoid..."
            value={intelligence.doNotDiscuss}
          />
        </label>
        <label>
          <span className="field-label">Best next move</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("bestNextMove", event.target.value)}
            placeholder="Recommended next action or ask..."
            value={intelligence.bestNextMove}
          />
        </label>
      </div>
      <div className="record-editor-grid intelligence-form-grid">
        <label>
          <span className="field-label">Relevant mandates</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relevantMandates", event.target.value)}
            placeholder="Port Modernization, Energy Introductions"
            value={intelligence.relevantMandates}
          />
        </label>
        <label>
          <span className="field-label">Relevant geographies</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relevantGeographies", event.target.value)}
            placeholder="UK, Brazil, West Africa"
            value={intelligence.relevantGeographies}
          />
        </label>
        <label>
          <span className="field-label">Relevant sectors</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relevantSectors", event.target.value)}
            placeholder="Infrastructure, Energy, Logistics"
            value={intelligence.relevantSectors}
          />
        </label>
        <label>
          <span className="field-label">Relevant institutions</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relevantInstitutions", event.target.value)}
            placeholder="Ministry, fund, development bank, trade body"
            value={intelligence.relevantInstitutions}
          />
        </label>
      </div>
    </div>
  );
}

function serializeIntelligence(intelligence: IntelligenceFormState) {
  const confidence = Number(intelligence.sourceConfidence);
  return {
    opposition: intelligence.opposition,
    trustLevel: intelligence.trustLevel,
    nationality: intelligence.nationality,
    languages: splitList(intelligence.languages),
    publicPrivateStatus: intelligence.publicPrivateStatus,
    influenceType: intelligence.influenceType,
    accessPath: intelligence.accessPath,
    relationshipOwner: intelligence.relationshipOwner,
    bestApproach: intelligence.bestApproach,
    currentAuthority: intelligence.currentAuthority,
    historicalAuthority: intelligence.historicalAuthority,
    sensitivityLevel: intelligence.sensitivityLevel,
    motivations: intelligence.motivations,
    constraints: intelligence.constraints,
    relevantMandates: splitList(intelligence.relevantMandates),
    relevantGeographies: splitList(intelligence.relevantGeographies),
    relevantSectors: splitList(intelligence.relevantSectors),
    relevantInstitutions: splitList(intelligence.relevantInstitutions),
    keyRelationships: intelligence.keyRelationships,
    doNotDiscuss: intelligence.doNotDiscuss,
    bestNextMove: intelligence.bestNextMove,
    sourceConfidence: Number.isFinite(confidence) && intelligence.sourceConfidence.trim() ? confidence / 100 : null,
    lastVerifiedDate: intelligence.lastVerifiedDate
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
