"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import {
  accessPathOptions,
  approachOptions,
  geographyOptions,
  influenceTypeOptions,
  institutionTypeOptions,
  mandateThemeOptions,
  publicPrivateStatusOptions,
  sectorOptions
} from "@/lib/intelligence-options";
import { createRelationship, stageContactImport } from "@/lib/supabase/relationship-actions";
import { Camera, Contact, FileUp, Plus, Smartphone } from "lucide-react";

const intakeMethods = [
  {
    id: "card",
    label: "Business card photo",
    icon: Camera,
    description: "Normalize a card image locally, OCR the text, and review parsed fields before merge. Originals are not uploaded."
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
type CardOcrResult = {
  name: string | null;
  title: string | null;
  organization: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  address: string | null;
  cardDateHint: string | null;
  rawText: string;
  confidence: number;
  warnings: string[];
};
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
  const [cardOcr, setCardOcr] = useState<CardOcrResult | null>(null);
  const [originalCardName, setOriginalCardName] = useState("");
  const [isPreparingCard, setIsPreparingCard] = useState(false);
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
        rawOcrText: cardOcr?.rawText,
        parsedCardFields: cardOcr ? buildCardParsedFields(cardOcr) : undefined,
        cardConfidence: cardOcr?.confidence,
        cardReviewed: Boolean(cardFile),
        avatarFile
      });
      setManualName("");
      setManualOrg("");
      setManualTitle("");
      setManualNotes("");
      setIntelligence(emptyIntelligence);
      setCardFile(null);
      setCardOcr(null);
      setOriginalCardName("");
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

  async function handleCardSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setStatus("");
    setCardOcr(null);
    setCardFile(null);
    setOriginalCardName("");

    if (!selectedFile) return;

    try {
      setIsPreparingCard(true);
      setStatus("Normalizing card image before OCR...");
      const normalizedFile = await normalizeBusinessCardImage(selectedFile);
      setCardFile(normalizedFile);
      setOriginalCardName(selectedFile.name);
      setStatus("Reading normalized card image...");

      const ocr = await runCardOcr(normalizedFile);
      setCardOcr(ocr);
      setManualName((current) => current || ocr.name || "");
      setManualTitle((current) => current || ocr.title || "");
      setManualOrg((current) => current || ocr.organization || "");
      setStatus("OCR complete. Review fields before saving.");
    } catch (cardError) {
      setError(cardError instanceof Error ? cardError.message : "Could not prepare business card image.");
      setStatus("");
    } finally {
      setIsPreparingCard(false);
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
                <small>Image files are converted locally to normalized JPEG before upload</small>
                <input accept="image/*" disabled={isPreparingCard} onChange={handleCardSelection} type="file" />
              </label>
              {cardFile ? (
                <div className="form-notice">
                  Normalized artifact ready: {cardFile.name}
                  {originalCardName ? ` from ${originalCardName}` : ""}. Original file was not uploaded.
                </div>
              ) : null}
              {cardOcr ? <CardOcrPreview result={cardOcr} /> : null}
              <form className="manual-form" onSubmit={handleManualSubmit}>
                <label>
                  <span className="field-label">Person name</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualName(event.target.value)}
                    placeholder="Full name"
                    value={manualName}
                  />
                </label>
                <label>
                  <span className="field-label">Title</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualTitle(event.target.value)}
                    placeholder="Current title"
                    value={manualTitle}
                  />
                </label>
                <label>
                  <span className="field-label">Organization</span>
                  <input
                    className="text-input"
                    onChange={(event) => setManualOrg(event.target.value)}
                    placeholder="Current organization"
                    value={manualOrg}
                  />
                </label>
                <IntelligenceCapture intelligence={intelligence} setIntelligence={setIntelligence} />
                {error ? <div className="form-error">{error}</div> : null}
                {status ? <div className="form-notice">{status}</div> : null}
                <button className="button primary" disabled={!isSupabase || isPreparingCard} type="submit">
                  <Plus size={16} />
                  {isPreparingCard ? "Preparing card..." : "Save reviewed card relationship"}
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
                  placeholder="Full name"
                  value={manualName}
                />
              </label>
              <label>
                <span className="field-label">Organization</span>
                <input
                  className="text-input"
                  onChange={(event) => setManualOrg(event.target.value)}
                  placeholder="Current organization"
                  value={manualOrg}
                />
              </label>
              <label>
                <span className="field-label">Title</span>
                <input
                  className="text-input"
                  onChange={(event) => setManualTitle(event.target.value)}
                  placeholder="Current title"
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
        <SelectField
          label="Influence type"
          onChange={(value) => updateField("influenceType", value)}
          options={influenceTypeOptions}
          value={intelligence.influenceType}
        />
        <SelectField
          label="Access path"
          onChange={(value) => updateField("accessPath", value)}
          options={accessPathOptions}
          value={intelligence.accessPath}
        />
        <label>
          <span className="field-label">Relationship owner</span>
          <input
            className="text-input"
            onChange={(event) => updateField("relationshipOwner", event.target.value)}
            placeholder="Internal owner"
            value={intelligence.relationshipOwner}
          />
        </label>
        <SelectField
          label="Best approach"
          onChange={(value) => updateField("bestApproach", value)}
          options={approachOptions}
          value={intelligence.bestApproach}
        />
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
        <SelectField
          label="Public/private status"
          onChange={(value) => updateField("publicPrivateStatus", value)}
          options={publicPrivateStatusOptions}
          value={intelligence.publicPrivateStatus}
        />
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
        <MultiSelectField
          label="Relevant mandates"
          onChange={(value) => updateField("relevantMandates", value)}
          options={mandateThemeOptions}
          value={intelligence.relevantMandates}
        />
        <MultiSelectField
          label="Relevant geographies"
          onChange={(value) => updateField("relevantGeographies", value)}
          options={geographyOptions}
          value={intelligence.relevantGeographies}
        />
        <MultiSelectField
          label="Relevant sectors"
          onChange={(value) => updateField("relevantSectors", value)}
          options={sectorOptions}
          value={intelligence.relevantSectors}
        />
        <MultiSelectField
          label="Relevant institutions"
          onChange={(value) => updateField("relevantInstitutions", value)}
          options={institutionTypeOptions}
          value={intelligence.relevantInstitutions}
        />
      </div>
    </div>
  );
}

function CardOcrPreview({ result }: { result: CardOcrResult }) {
  return (
    <div className="review-section">
      <div className="review-section-header">
        <div>
          <div className="field-label">OCR review</div>
          <div className="field-value">Review and correct fields below before saving.</div>
        </div>
        <Badge tone={result.confidence >= 0.75 ? "green" : "amber"}>{Math.round(result.confidence * 100)}%</Badge>
      </div>
      <div className="parsed-fields">
        <div>
          <dt>Name</dt>
          <dd>{result.name ?? "Not detected"}</dd>
        </div>
        <div>
          <dt>Title</dt>
          <dd>{result.title ?? "Not detected"}</dd>
        </div>
        <div>
          <dt>Organization</dt>
          <dd>{result.organization ?? "Not detected"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{result.emails.join(", ") || "Not detected"}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{result.phones.join(", ") || "Not detected"}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{result.warnings.join(", ") || "None"}</dd>
        </div>
      </div>
    </div>
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

function buildCardParsedFields(ocr: CardOcrResult) {
  return {
    name: ocr.name,
    title: ocr.title,
    organization: ocr.organization,
    emails: ocr.emails,
    phones: ocr.phones,
    website: ocr.website,
    address: ocr.address,
    cardDateHint: ocr.cardDateHint,
    warnings: ocr.warnings
  };
}

async function runCardOcr(file: File): Promise<CardOcrResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/cards/ocr", {
    method: "POST",
    body: formData
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Business card OCR failed.");
  }

  return normalizeCardOcrResult(payload);
}

function normalizeCardOcrResult(value: unknown): CardOcrResult {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    name: nullableString(record.name),
    title: nullableString(record.title),
    organization: nullableString(record.organization),
    emails: stringArray(record.emails),
    phones: stringArray(record.phones),
    website: nullableString(record.website),
    address: nullableString(record.address),
    cardDateHint: nullableString(record.cardDateHint),
    rawText: typeof record.rawText === "string" ? record.rawText : "",
    confidence: clampConfidence(record.confidence),
    warnings: stringArray(record.warnings)
  };
}

async function normalizeBusinessCardImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Business card capture currently accepts image files only. Convert PDFs to an image before upload.");
  }

  const image = await loadImage(file);
  const maxLongEdge = 1600;
  const scale = Math.min(1, maxLongEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image canvas.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
  URL.revokeObjectURL(image.src);

  if (!blob) {
    throw new Error("Could not convert card image.");
  }

  return new File([blob], `${baseFileName(file.name)}-normalized.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(image.src);
      reject(new Error("This image format could not be decoded in the browser. Export it as JPG or PNG and try again."));
    };
    image.src = URL.createObjectURL(file);
  });
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function clampConfidence(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(1, numberValue));
}

function baseFileName(name: string) {
  return (name.replace(/\.[^.]+$/, "") || "business-card").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
