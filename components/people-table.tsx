"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import { people } from "@/lib/mock-data";
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

export function PeopleTable() {
  const table = useReactTable({
    data: people,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

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
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
