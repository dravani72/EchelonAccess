"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/badge";
import { Camera, Contact, FileUp, Plus, Smartphone } from "lucide-react";

const intakeMethods = [
  { id: "card", label: "Business card photo", icon: Camera, description: "Upload a card image, preserve the artifact, OCR the text, and review parsed fields before merge." },
  { id: "mobile", label: "Mobile contact transfer", icon: Smartphone, description: "Import a vCard/contact export from iOS, Android, Google Contacts, or another address book." },
  { id: "manual", label: "Manual entry", icon: Contact, description: "Create a relationship record by hand when no card or device transfer is available." }
] as const;

type IntakeMethod = (typeof intakeMethods)[number]["id"];

export function RelationshipIntake() {
  const [method, setMethod] = useState<IntakeMethod>("card");
  const [manualName, setManualName] = useState("");
  const [manualOrg, setManualOrg] = useState("");
  function handleManualSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); }
  const selected = intakeMethods.find((item) => item.id === method)!;

  return <section className="panel" id="Add Relationship"><div className="panel-header"><div><h2 className="panel-title">Add Relationship</h2><div className="section-kicker">Choose the source first so every relationship begins with evidence.</div></div><Badge tone="blue">Source-aware intake</Badge></div><div className="panel-body"><div className="intake-methods" role="tablist" aria-label="Relationship intake method">{intakeMethods.map((item) => <button aria-selected={method === item.id} className={`intake-method ${method === item.id ? "active" : ""}`} key={item.id} onClick={() => setMethod(item.id)} role="tab" type="button"><item.icon size={18} /><span>{item.label}</span></button>)}</div><div className="intake-layout"><div className="intake-detail"><div className="badge-row"><Badge tone={method === "card" ? "amber" : method === "mobile" ? "green" : "blue"}>{selected.label}</Badge><Badge tone="purple">Human review required</Badge></div><p>{selected.description}</p></div>{method === "card" ? <div className="intake-workflow"><label className="upload-zone"><FileUp size={24} /><span>Drop or choose business card photo</span><small>JPG, PNG, HEIC, or PDF scan</small><input accept="image/*,.pdf" type="file" /></label><div className="intake-steps"><span>OCR text capture</span><span>AI field parsing</span><span>Duplicate suggestion</span><span>User approval</span></div></div> : null}{method === "mobile" ? <div className="intake-workflow"><label className="upload-zone"><Smartphone size={24} /><span>Import mobile contacts</span><small>Upload .vcf, .csv, or exported address book file</small><input accept=".vcf,.csv,text/vcard,text/csv" type="file" /></label><div className="mobile-transfer-grid"><button className="button" type="button">iOS vCard</button><button className="button" type="button">Android export</button><button className="button" type="button">Google Contacts CSV</button></div></div> : null}{method === "manual" ? <form className="manual-form" onSubmit={handleManualSubmit}><label><span className="field-label">Person name</span><input className="text-input" onChange={(event) => setManualName(event.target.value)} placeholder="Amelia Hart" value={manualName} /></label><label><span className="field-label">Organization</span><input className="text-input" onChange={(event) => setManualOrg(event.target.value)} placeholder="Northbridge Capital" value={manualOrg} /></label><label><span className="field-label">Relationship context</span><textarea className="text-area" placeholder="How you know them, source, mandate relevance, next step..." /></label><button className="button primary" type="submit"><Plus size={16} />Stage manual record</button></form> : null}</div></div></section>;
}
