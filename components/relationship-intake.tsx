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

export function RelationshipIntake({ workspaceId, source }: { workspaceId?: string; source: "supabase" | "mock" }) {
  const router = useRouter();
  const [method, setMethod] = useState<IntakeMethod>("card");
  const [manualName, setManualName] = useState("");
  const [manualOrg, setManualOrg] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
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
        cardFile,
        avatarFile
      });
      setManualName("");
      setManualOrg("");
      setManualTitle("");
      setManualNotes("");
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
