"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import { deletePerson, updatePerson } from "@/lib/supabase/relationship-actions";
import { Pencil, Save, Trash2, X } from "lucide-react";
import type { Person } from "@/types/domain";

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

export function PeopleTable({ people, source }: { people: Person[]; source: "supabase" | "mock" }) {
  const router = useRouter();
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editStrength, setEditStrength] = useState(1);
  const [editWarmth, setEditWarmth] = useState<Person["warmthStatus"]>("cold");
  const [editNotes, setEditNotes] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const table = useReactTable({
    data: people,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function beginEdit(person: Person) {
    setEditingPerson(person);
    setEditName(person.displayName);
    setEditTitle(person.currentTitle);
    setEditOrganization(person.currentOrganization);
    setEditStrength(person.relationshipStrength);
    setEditWarmth(person.warmthStatus);
    setEditNotes(person.notes ?? "");
    setStatus("");
    setError("");
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
        notes: editNotes
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
          <h2 className="panel-title">People Intelligence</h2>
          <div className="section-kicker">Dense relationship table with source and mandate context.</div>
        </div>
        <div className="badge-row">
          <Badge tone="blue">Government</Badge>
          <Badge tone="purple">Active mandate</Badge>
          <Badge tone="amber">Needs review</Badge>
        </div>
      </div>
      {editingPerson ? (
        <div className="record-editor">
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
      <div className="panel-body" style={{ padding: 0 }}>
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
                <td>
                  <div className="table-actions">
                    <button className="button icon-button" disabled={source !== "supabase"} onClick={() => beginEdit(row.original)} type="button">
                      <Pencil size={15} />
                    </button>
                    <button className="button icon-button" disabled={source !== "supabase"} onClick={() => handleDelete(row.original)} type="button">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
