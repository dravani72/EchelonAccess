"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
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
import { deletePerson, updatePerson } from "@/lib/supabase/relationship-actions";
import { Building2, GitBranch, Network, Pencil, Save, Search, Trash2, Users, X } from "lucide-react";
import type { Mandate, OutreachItem, Person, Role } from "@/types/domain";

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("displayName", {
    header: "Name",
    cell: ({ row }) => (
      <div className="person-cell">
        <span className="person-name">{row.original.displayName}</span>
        <span className="muted">{row.original.currentTitle}</span>
      </div>
    )
  }),
  columnHelper.accessor("currentOrganization", {
    header: "Organization"
  }),
  columnHelper.accessor("relationshipStrength", {
    header: "Strength",
    cell: ({ getValue }) => <Badge tone="blue">{getValue()}/5</Badge>
  }),
  columnHelper.accessor("warmthStatus", {
    header: "Warmth",
    cell: ({ getValue }) => <Badge tone={getValue() === "direct" ? "green" : "amber"}>{formatStatus(getValue())}</Badge>
  }),
  columnHelper.accessor("geography", {
    header: "Geography"
  }),
  columnHelper.accessor("mandateMatches", {
    header: "Mandates",
    cell: ({ getValue }) => <Badge tone="purple">{getValue()} matches</Badge>
  }),
  columnHelper.accessor("reviewStatus", {
    header: "Review",
    cell: ({ getValue }) => (
      <Badge tone={getValue() === "verified" ? "green" : getValue() === "possible_duplicate" ? "red" : "amber"}>
        {formatStatus(getValue())}
      </Badge>
    )
  })
];

const pageSize = 25;
type EditIntelligenceState = {
  trustLevel: "" | NonNullable<Person["trustLevel"]>;
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
  sensitivityLevel: "" | NonNullable<Person["sensitivityLevel"]>;
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

const emptyEditIntelligence: EditIntelligenceState = {
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

export function PeopleTable({
  people,
  mandates,
  outreachQueue,
  roles,
  source
}: {
  people: Person[];
  mandates: Mandate[];
  outreachQueue: OutreachItem[];
  roles: Role[];
  source: "supabase" | "mock";
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedScopeId, setSelectedScopeId] = useState("all");
  const [query, setQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | Person["reviewStatus"]>("all");
  const [page, setPage] = useState(0);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editStrength, setEditStrength] = useState(1);
  const [editWarmth, setEditWarmth] = useState<Person["warmthStatus"]>("cold");
  const [editNotes, setEditNotes] = useState("");
  const [editIntelligence, setEditIntelligence] = useState<EditIntelligenceState>(emptyEditIntelligence);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selectedMandate = mandates.find((mandate) => mandate.id === selectedScopeId);
  const scopedPeople = useMemo(
    () => (selectedMandate ? people.filter((person) => personMatchesMandate(person, selectedMandate, outreachQueue)) : people),
    [outreachQueue, people, selectedMandate]
  );
  const filteredPeople = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredQuery);
    return scopedPeople.filter((person) => {
      const matchesReview = reviewFilter === "all" || person.reviewStatus === reviewFilter;
      const matchesSearch =
        !normalizedQuery ||
        [
          person.displayName,
          person.currentTitle,
          person.currentOrganization,
          person.trustLevel ?? "",
          person.geography,
          person.sectorTags.join(" "),
          person.influenceType ?? "",
          person.accessPath ?? "",
          person.relationshipOwner ?? "",
          person.bestApproach ?? "",
          person.currentAuthority ?? "",
          person.historicalAuthority ?? "",
          person.motivations ?? "",
          person.constraints ?? "",
          person.opposition ?? "",
          person.relevantMandates?.join(" ") ?? "",
          person.relevantGeographies?.join(" ") ?? "",
          person.relevantSectors?.join(" ") ?? "",
          person.relevantInstitutions?.join(" ") ?? "",
          person.keyRelationships ?? "",
          person.doNotDiscuss ?? "",
          person.bestNextMove ?? "",
          person.notes ?? ""
        ]
          .map(normalizeSearch)
          .some((value) => value.includes(normalizedQuery));

      return matchesReview && matchesSearch;
    });
  }, [deferredQuery, reviewFilter, scopedPeople]);
  const pageCount = Math.max(1, Math.ceil(filteredPeople.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visiblePeople = filteredPeople.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const scopedOrganizationCount = useMemo(() => {
    const scopedIds = new Set(scopedPeople.map((person) => person.id));
    const organizations = new Set<string>();
    scopedPeople.forEach((person) => {
      if (person.currentOrganization) organizations.add(person.currentOrganization);
    });
    roles.forEach((role) => {
      if (scopedIds.has(role.personId)) organizations.add(role.organizationName);
    });
    return organizations.size;
  }, [roles, scopedPeople]);
  const table = useReactTable({
    data: visiblePeople,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function setScope(scopeId: string) {
    setSelectedScopeId(scopeId);
    setPage(0);
  }

  function setSearch(value: string) {
    setQuery(value);
    setPage(0);
  }

  function setReview(value: "all" | Person["reviewStatus"]) {
    setReviewFilter(value);
    setPage(0);
  }

  function beginEdit(person: Person) {
    setEditingPerson(person);
    setEditName(person.displayName);
    setEditTitle(person.currentTitle);
    setEditOrganization(person.currentOrganization);
    setEditStrength(person.relationshipStrength);
    setEditWarmth(person.warmthStatus);
    setEditNotes(person.notes ?? "");
    setEditIntelligence(personToEditIntelligence(person));
    setStatus("");
    setError("");
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  async function handleSaveEdit() {
    if (!editingPerson) return;

    try {
      setStatus("Saving changes...");
      setError("");
      await updatePerson(editingPerson.id, {
        displayName: editName,
        currentTitle: editTitle,
        currentOrganization: editOrganization,
        relationshipStrength: editStrength,
        warmthStatus: editWarmth,
        notes: editNotes,
        ...serializeEditIntelligence(editIntelligence)
      });
      setEditingPerson(null);
      setStatus("Relationship updated.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update relationship.");
      setStatus("");
    }
  }

  async function handleDelete(person: Person) {
    if (!window.confirm(`Remove ${person.displayName} from active relationship records?`)) {
      return;
    }

    try {
      setStatus("Removing relationship...");
      setError("");
      await deletePerson(person.id);
      setStatus("Relationship removed.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove relationship.");
      setStatus("");
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">People Records</h2>
          <div className="section-kicker">Edit people, roles, review status, and mandate scope without loading dossier views.</div>
        </div>
        <div className="badge-row">
          <Badge tone="blue">{filteredPeople.length} people</Badge>
          <Badge tone="purple">{scopedOrganizationCount} organizations</Badge>
          <Badge tone="amber">{selectedMandate ? selectedMandate.title : "All people"}</Badge>
        </div>
      </div>
      <div className="people-workbench">
        <aside className="scope-panel">
          <div className="scope-panel-title">
            <GitBranch size={15} />
            Scope
          </div>
          <button className={`scope-option ${selectedScopeId === "all" ? "active" : ""}`} onClick={() => setScope("all")} type="button">
            <span>All people</span>
            <Badge tone="blue">{people.length}</Badge>
          </button>
          {mandates.map((mandate) => {
            const count = people.filter((person) => personMatchesMandate(person, mandate, outreachQueue)).length;
            return (
              <button
                className={`scope-option ${selectedScopeId === mandate.id ? "active" : ""} ${mandate.isMockData ? "mock-record" : ""}`}
                key={mandate.id}
                onClick={() => setScope(mandate.id)}
                type="button"
              >
                <span>{mandate.title}</span>
                <Badge tone={mandate.status === "active" ? "green" : "purple"}>{count}</Badge>
              </button>
            );
          })}
        </aside>

        <div className="scope-main">
          <div className="scope-graph" aria-label="Scoped relationship graph">
            <button className={`graph-node graph-node-mandate ${selectedMandate ? "active" : ""}`} onClick={() => setScope(selectedMandate?.id ?? "all")} type="button">
              <Network size={15} />
              {selectedMandate ? selectedMandate.title : "All people"}
            </button>
            <div className="graph-link" />
            <div className="graph-cluster">
              <button className="graph-node graph-node-people" type="button">
                <Users size={15} />
                {filteredPeople.length} people
              </button>
              <button className="graph-node graph-node-orgs" type="button">
                <Building2 size={15} />
                {scopedOrganizationCount} orgs
              </button>
            </div>
          </div>

          <div className="people-controls">
            <label className="search-control">
              <Search size={15} />
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search scoped people, organizations, roles, sectors..."
                value={query}
              />
            </label>
            <select className="text-input compact-select" onChange={(event) => setReview(event.target.value as "all" | Person["reviewStatus"])} value={reviewFilter}>
              <option value="all">All review states</option>
              <option value="verified">Verified</option>
              <option value="needs_review">Needs review</option>
              <option value="possible_duplicate">Possible duplicate</option>
            </select>
          </div>
        </div>
      </div>
      {editingPerson ? (
        <div className={`record-editor ${editingPerson.isMockData ? "mock-record" : ""}`} ref={editorRef}>
          <div className="record-editor-grid">
            <label>
              <span className="field-label">Name</span>
              <input className="text-input" onChange={(event) => setEditName(event.target.value)} value={editName} />
            </label>
            <label>
              <span className="field-label">Title</span>
              <input className="text-input" onChange={(event) => setEditTitle(event.target.value)} value={editTitle} />
            </label>
            <label>
              <span className="field-label">Organization</span>
              <input
                className="text-input"
                onChange={(event) => setEditOrganization(event.target.value)}
                value={editOrganization}
              />
            </label>
            <label>
              <span className="field-label">Strength</span>
              <select
                className="text-input"
                onChange={(event) => setEditStrength(Number(event.target.value))}
                value={editStrength}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Warmth</span>
              <select
                className="text-input"
                onChange={(event) => setEditWarmth(event.target.value as Person["warmthStatus"])}
                value={editWarmth}
              >
                {["cold", "weak", "known", "warm", "direct"].map((value) => (
                  <option key={value} value={value}>
                    {formatStatus(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <EditIntelligenceFields intelligence={editIntelligence} setIntelligence={setEditIntelligence} />
          <label>
            <span className="field-label">Notes</span>
            <textarea className="text-area" onChange={(event) => setEditNotes(event.target.value)} value={editNotes} />
          </label>
          <div className="record-editor-actions">
            <button className="button primary" onClick={handleSaveEdit} type="button">
              <Save size={16} />
              Save
            </button>
            <button className="button" onClick={() => setEditingPerson(null)} type="button">
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {error ? <div className="form-error panel-message">{error}</div> : null}
      {status ? <div className="form-notice panel-message">{status}</div> : null}
      <div className="panel-body people-table-wrap" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr className={row.original.isMockData ? "mock-record" : undefined} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                  <td>
                    <div className="table-actions">
                      <button
                        aria-label={`Edit ${row.original.displayName}`}
                        className="button icon-button"
                        onClick={() => beginEdit(row.original)}
                        title={source === "supabase" ? "Edit relationship" : "Open editor"}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Delete ${row.original.displayName}`}
                        className="button icon-button"
                        onClick={() => handleDelete(row.original)}
                        title={source === "supabase" ? "Delete relationship" : "Try delete"}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">No people match the current scope.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-bar">
        <span>
          Showing {filteredPeople.length ? safePage * pageSize + 1 : 0}-{Math.min((safePage + 1) * pageSize, filteredPeople.length)} of{" "}
          {filteredPeople.length}
        </span>
        <div className="table-actions">
          <button className="button" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} type="button">
            Previous
          </button>
          <span className="page-indicator">
            {safePage + 1} / {pageCount}
          </span>
          <button
            className="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function personMatchesMandate(person: Person, mandate: Mandate, outreachQueue: OutreachItem[]) {
  const queuedNames = new Set(
    outreachQueue
      .filter((item) => normalizeSearch(item.mandateTitle) === normalizeSearch(mandate.title))
      .map((item) => normalizeSearch(item.personName))
  );
  const personName = normalizeSearch(person.displayName);
  const sectorMatch = mandate.sector ? person.sectorTags.map(normalizeSearch).includes(normalizeSearch(mandate.sector)) : false;
  const geographyMatch =
    mandate.geography?.some((place) => {
      const normalizedPlace = normalizeSearch(place);
      const normalizedPersonGeo = normalizeSearch(person.geography);
      return normalizedPersonGeo.includes(normalizedPlace) || normalizedPlace.includes(normalizedPersonGeo);
    }) ?? false;

  return queuedNames.has(personName) || sectorMatch || geographyMatch;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function EditIntelligenceFields({
  intelligence,
  setIntelligence
}: {
  intelligence: EditIntelligenceState;
  setIntelligence: (value: EditIntelligenceState) => void;
}) {
  function updateField<K extends keyof EditIntelligenceState>(field: K, value: EditIntelligenceState[K]) {
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
          <input className="text-input" onChange={(event) => updateField("relationshipOwner", event.target.value)} value={intelligence.relationshipOwner} />
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
            onChange={(event) => updateField("sensitivityLevel", event.target.value as EditIntelligenceState["sensitivityLevel"])}
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
            onChange={(event) => updateField("trustLevel", event.target.value as EditIntelligenceState["trustLevel"])}
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
          <input className="text-input" onChange={(event) => updateField("nationality", event.target.value)} value={intelligence.nationality} />
        </label>
        <label>
          <span className="field-label">Languages</span>
          <input className="text-input" onChange={(event) => updateField("languages", event.target.value)} value={intelligence.languages} />
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
            type="number"
            value={intelligence.sourceConfidence}
          />
        </label>
        <label>
          <span className="field-label">Last verified</span>
          <input className="text-input" onChange={(event) => updateField("lastVerifiedDate", event.target.value)} type="date" value={intelligence.lastVerifiedDate} />
        </label>
      </div>
      <div className="intelligence-text-grid">
        {[
          ["currentAuthority", "Current authority"],
          ["historicalAuthority", "Historical authority"],
          ["motivations", "Motivations"],
          ["constraints", "Constraints"],
          ["opposition", "Opposition / blockers"],
          ["keyRelationships", "Key relationships"],
          ["doNotDiscuss", "Do not discuss"],
          ["bestNextMove", "Best next move"]
        ].map(([field, label]) => (
          <label key={field}>
            <span className="field-label">{label}</span>
            <textarea
              className="text-area"
              onChange={(event) => updateField(field as keyof EditIntelligenceState, event.target.value as never)}
              value={String(intelligence[field as keyof EditIntelligenceState])}
            />
          </label>
        ))}
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

function personToEditIntelligence(person: Person): EditIntelligenceState {
  return {
    opposition: person.opposition ?? "",
    trustLevel: person.trustLevel ?? "",
    nationality: person.nationality ?? "",
    languages: person.languages?.join(", ") ?? "",
    publicPrivateStatus: person.publicPrivateStatus ?? "",
    influenceType: person.influenceType ?? "",
    accessPath: person.accessPath ?? "",
    relationshipOwner: person.relationshipOwner ?? "",
    bestApproach: person.bestApproach ?? "",
    currentAuthority: person.currentAuthority ?? "",
    historicalAuthority: person.historicalAuthority ?? "",
    sensitivityLevel: person.sensitivityLevel ?? "",
    motivations: person.motivations ?? "",
    constraints: person.constraints ?? "",
    relevantMandates: person.relevantMandates?.join(", ") ?? "",
    relevantGeographies: person.relevantGeographies?.join(", ") ?? "",
    relevantSectors: person.relevantSectors?.join(", ") ?? "",
    relevantInstitutions: person.relevantInstitutions?.join(", ") ?? "",
    keyRelationships: person.keyRelationships ?? "",
    doNotDiscuss: person.doNotDiscuss ?? "",
    bestNextMove: person.bestNextMove ?? "",
    sourceConfidence: person.sourceConfidence === undefined ? "" : String(Math.round(person.sourceConfidence * 100)),
    lastVerifiedDate: person.lastVerifiedDate ?? ""
  };
}

function serializeEditIntelligence(intelligence: EditIntelligenceState) {
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
