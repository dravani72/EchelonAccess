"use client";

import { PointerEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/badge";
import type { AppData } from "@/lib/data";
import type { Mandate, Person } from "@/types/domain";

type GraphFocus = "relationship" | "mandate" | "institution" | "people";
type GraphNodeKind = "mandate" | "person" | "organization" | "signal";
type GraphNode = {
  id: string;
  label: string;
  eyebrow: string;
  detail: string;
  kind: GraphNodeKind;
  score: number;
  x: number;
  y: number;
};
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
};
type GraphOptions = {
  focus: GraphFocus;
  depth: number;
  maxNodes: number;
};
type NodeDraft = Omit<GraphNode, "x" | "y">;
type DragState = {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const graphWidth = 1180;
const graphHeight = 860;
const nodeWidth = 172;
const nodeHeight = 78;

const focusOptions: { label: string; value: GraphFocus }[] = [
  { label: "All connection types", value: "relationship" },
  { label: "Mandate-led", value: "mandate" },
  { label: "Institution-led", value: "institution" },
  { label: "People-led", value: "people" }
];

export function RelationshipGraph({ data }: { data: AppData }) {
  const [focus, setFocus] = useState<GraphFocus>("relationship");
  const [depth, setDepth] = useState("2");
  const [maxNodes, setMaxNodes] = useState("100");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const graph = useMemo(
    () =>
      buildRelationshipGraph(data, {
        depth: Number(depth),
        focus,
        maxNodes: Number(maxNodes)
      }),
    [data, depth, focus, maxNodes]
  );

  useEffect(() => {
    setPositions(Object.fromEntries(graph.nodes.map((node) => [node.id, { x: node.x, y: node.y }])));
  }, [graph]);

  const nodes = graph.nodes.map((node) => ({ ...node, ...(positions[node.id] ?? { x: node.x, y: node.y }) }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  function beginDrag(event: PointerEvent<HTMLButtonElement>, node: GraphNode) {
    const position = positions[node.id] ?? { x: node.x, y: node.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      id: node.id,
      originX: position.x,
      originY: position.y,
      startX: event.clientX,
      startY: event.clientY
    });
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!dragState) return;
    const nextX = clamp(dragState.originX + event.clientX - dragState.startX, 0, graphWidth - nodeWidth);
    const nextY = clamp(dragState.originY + event.clientY - dragState.startY, 0, graphHeight - nodeHeight);
    setPositions((current) => ({ ...current, [dragState.id]: { x: nextX, y: nextY } }));
  }

  function endDrag() {
    setDragState(null);
  }

  return (
    <section className="relationship-graph-panel" aria-label="Relationship graph">
      <div className="relationship-graph-header">
        <div>
          <div className="field-label">Relationship Map</div>
          <h3 className="relationship-graph-title">Drag entities to inspect connection paths</h3>
        </div>
        <div className="relationship-graph-stats">
          <Badge tone="green">{graph.stats.people} people</Badge>
          <Badge tone="purple">{graph.stats.mandates} mandates</Badge>
          <Badge tone="amber">{graph.stats.organizations} institutions</Badge>
          <Badge tone="blue">{graph.edges.length} edges</Badge>
        </div>
      </div>

      <div className="relationship-graph-controls" aria-label="Graph controls">
        <label>
          <span className="field-label">Focus</span>
          <select
            className="text-input compact-select"
            name="relationship-graph-focus"
            onChange={(event) => setFocus(event.target.value as GraphFocus)}
            value={focus}
          >
            {focusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Depth</span>
          <select
            className="text-input compact-select"
            name="relationship-graph-depth"
            onChange={(event) => setDepth(event.target.value)}
            value={depth}
          >
            <option value="1">Direct ties</option>
            <option value="2">Shared context</option>
            <option value="3">Extended surface</option>
          </select>
        </label>
        <label>
          <span className="field-label">Graph size</span>
          <select
            className="text-input compact-select"
            name="relationship-graph-size"
            onChange={(event) => setMaxNodes(event.target.value)}
            value={maxNodes}
          >
            <option value="60">Tight</option>
            <option value="100">Balanced</option>
            <option value="140">Broad</option>
          </select>
        </label>
      </div>

      <div className="relationship-graph-canvas" style={{ ["--graph-width" as string]: `${graphWidth}px` }}>
        {nodes.length ? (
          <div className="relationship-graph-stage" style={{ height: graphHeight, width: graphWidth }}>
            <svg aria-hidden className="relationship-graph-edges" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`} width={graphWidth}>
              {graph.edges.map((edge) => {
                const source = nodeById.get(edge.source);
                const target = nodeById.get(edge.target);
                if (!source || !target) return null;
                const sourcePoint = { x: source.x + nodeWidth, y: source.y + nodeHeight / 2 };
                const targetPoint = { x: target.x, y: target.y + nodeHeight / 2 };
                const midX = sourcePoint.x + Math.max(48, (targetPoint.x - sourcePoint.x) / 2);
                return (
                  <path
                    className="relationship-graph-edge"
                    d={`M ${sourcePoint.x} ${sourcePoint.y} C ${midX} ${sourcePoint.y}, ${midX} ${targetPoint.y}, ${targetPoint.x} ${targetPoint.y}`}
                    key={edge.id}
                    style={{ opacity: Math.min(0.9, 0.28 + edge.weight * 0.1), strokeWidth: Math.min(3, 0.9 + edge.weight * 0.22) }}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <button
                aria-label={`${node.eyebrow}: ${node.label}`}
                className={`relationship-node relationship-node-${node.kind}`}
                key={node.id}
                onPointerCancel={endDrag}
                onPointerDown={(event) => beginDrag(event, node)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                style={{ left: node.x, top: node.y }}
                type="button"
              >
                <span className="relationship-node-eyebrow">{node.eyebrow}</span>
                <span className="relationship-node-label">{node.label}</span>
                <span className="relationship-node-detail">{node.detail}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">Add people, mandates, organizations, or outreach records to generate the graph.</div>
        )}
      </div>

      <div className="relationship-graph-legend">
        <LegendItem kind="mandate" label="Mandate" />
        <LegendItem kind="person" label="Person" />
        <LegendItem kind="organization" label="Institution" />
        <LegendItem kind="signal" label="Scope signal" />
      </div>
    </section>
  );
}

function LegendItem({ kind, label }: { kind: GraphNodeKind; label: string }) {
  return (
    <span>
      <i className={`relationship-legend-dot relationship-legend-${kind}`} />
      {label}
    </span>
  );
}

function buildRelationshipGraph(data: AppData, options: GraphOptions) {
  const nodeDrafts = new Map<string, NodeDraft>();
  const edgeDrafts = new Map<string, GraphEdge>();
  const people = [...data.people]
    .sort((left, right) => scorePerson(right, options.focus) - scorePerson(left, options.focus))
    .slice(0, personLimit(options));
  const mandates = [...data.mandates]
    .sort((left, right) => scoreMandate(right, options.focus) - scoreMandate(left, options.focus))
    .slice(0, mandateLimit(options));
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const peopleByName = new Map(people.map((person) => [normalizeToken(person.displayName), person]));
  const mandatesById = new Map(mandates.map((mandate) => [mandate.id, mandate]));
  const mandatesByTitle = new Map(mandates.map((mandate) => [normalizeToken(mandate.title), mandate]));
  const mandateSignals = mandates.map((mandate) => ({ mandate, tokens: mandateTokens(mandate) }));

  for (const mandate of mandates.slice(0, Math.min(mandates.length, 18))) {
    addNode(nodeDrafts, mandateNode(mandate));
  }

  for (const person of people) {
    addNode(nodeDrafts, personNode(person));
    if (person.currentOrganization) {
      const organization = addOrganizationNode(nodeDrafts, person.currentOrganization, "Current organization", scorePerson(person, options.focus));
      addEdge(edgeDrafts, personNodeId(person.id), organization.id, "current role", 4);
    }

    for (const institution of (person.relevantInstitutions ?? []).slice(0, options.depth + 1)) {
      const organization = addOrganizationNode(nodeDrafts, institution, "Relevant institution", 2);
      addEdge(edgeDrafts, personNodeId(person.id), organization.id, "institution context", 2);
    }

    for (const mandateTitle of (person.relevantMandates ?? []).slice(0, options.depth + 1)) {
      const mandate = mandatesByTitle.get(normalizeToken(mandateTitle));
      if (mandate) {
        addNode(nodeDrafts, mandateNode(mandate));
        addEdge(edgeDrafts, personNodeId(person.id), mandateNodeId(mandate.id), "named mandate", 5);
      }
    }

    for (const match of bestMandateMatches(person, mandateSignals, options.depth)) {
      addNode(nodeDrafts, mandateNode(match.mandate));
      addEdge(edgeDrafts, personNodeId(person.id), mandateNodeId(match.mandate.id), "overlap", match.score);
    }
  }

  for (const role of data.roles.slice(0, roleLimit(options))) {
    const person = peopleById.get(role.personId);
    if (!person) continue;
    const organization = addOrganizationNode(
      nodeDrafts,
      role.organizationName,
      role.isCurrent ? "Current role" : "Prior role",
      role.isCurrent ? 3 : 1
    );
    addEdge(edgeDrafts, personNodeId(person.id), organization.id, role.isCurrent ? "role" : "prior role", role.isCurrent ? 4 : 2);
  }

  if (options.focus !== "people") {
    for (const mandate of mandates) {
      for (const counterparty of [
        ...(mandate.desiredCounterparties ?? []),
        ...(mandate.strategicPartners ?? []),
        ...(options.depth >= 3 ? mandate.governmentTouchpoints ?? [] : [])
      ].slice(0, 3 + options.depth)) {
        const organization = addOrganizationNode(nodeDrafts, counterparty, "Mandate counterparty", scoreMandate(mandate, options.focus));
        addEdge(edgeDrafts, mandateNodeId(mandate.id), organization.id, "target", 3);
      }

      if (options.depth >= 2) {
        for (const signal of [...(mandate.geography ?? []), mandate.sector, ...(mandate.targetCounterpartyTypes ?? [])].slice(0, 4)) {
          if (!signal) continue;
          const signalNode = addSignalNode(nodeDrafts, signal, classifySignal(signal), 1);
          addEdge(edgeDrafts, mandateNodeId(mandate.id), signalNode.id, "scope", 1);
        }
      }
    }
  }

  for (const interaction of data.interactions.slice(0, 180)) {
    if (interaction.personId && peopleById.has(interaction.personId) && interaction.mandateId && mandatesById.has(interaction.mandateId)) {
      addNode(nodeDrafts, mandateNode(mandatesById.get(interaction.mandateId)!));
      addEdge(edgeDrafts, personNodeId(interaction.personId), mandateNodeId(interaction.mandateId), interaction.type, 5);
    }
  }

  for (const outreach of data.outreachQueue.slice(0, 120)) {
    const person = peopleByName.get(normalizeToken(outreach.personName));
    const mandate = mandatesByTitle.get(normalizeToken(outreach.mandateTitle));
    if (!person || !mandate) continue;
    addNode(nodeDrafts, mandateNode(mandate));
    addEdge(edgeDrafts, personNodeId(person.id), mandateNodeId(mandate.id), "outreach", 4);
  }

  const connectedNodeIds = new Set<string>();
  const rankedEdges = [...edgeDrafts.values()]
    .filter((edge) => nodeDrafts.has(edge.source) && nodeDrafts.has(edge.target))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, options.maxNodes * 2);

  for (const edge of rankedEdges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  const rankedNodes = [...nodeDrafts.values()]
    .filter((node) => connectedNodeIds.has(node.id) || node.kind === "mandate")
    .sort((left, right) => right.score - left.score)
    .slice(0, options.maxNodes);
  const allowedNodeIds = new Set(rankedNodes.map((node) => node.id));
  const nodes = layoutNodes(rankedNodes);
  const edges = rankedEdges.filter((edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target)).slice(0, options.maxNodes * 2);

  return {
    edges,
    nodes,
    stats: {
      mandates: nodes.filter((node) => node.kind === "mandate").length,
      organizations: nodes.filter((node) => node.kind === "organization").length,
      people: nodes.filter((node) => node.kind === "person").length
    }
  };
}

function layoutNodes(nodeDrafts: NodeDraft[]): GraphNode[] {
  const laneIndexes: Record<GraphNodeKind, number> = {
    mandate: 0,
    person: 0,
    organization: 0,
    signal: 0
  };
  const laneX: Record<GraphNodeKind, number> = {
    mandate: 32,
    person: 330,
    organization: 628,
    signal: 926
  };

  return nodeDrafts.map((draft) => {
    const index = laneIndexes[draft.kind];
    laneIndexes[draft.kind] += 1;
    return {
      ...draft,
      x: laneX[draft.kind] + Math.floor(index / 9) * 42,
      y: 28 + (index % 9) * 92
    };
  });
}

function addNode(nodes: Map<string, NodeDraft>, draft: NodeDraft) {
  const existing = nodes.get(draft.id);
  if (!existing || draft.score > existing.score) nodes.set(draft.id, draft);
}

function addOrganizationNode(nodes: Map<string, NodeDraft>, label: string, detail: string, score: number) {
  const draft: NodeDraft = {
    detail,
    eyebrow: "Institution",
    id: organizationNodeId(label),
    kind: "organization",
    label,
    score
  };
  addNode(nodes, draft);
  return draft;
}

function addSignalNode(nodes: Map<string, NodeDraft>, label: string, detail: string, score: number) {
  const draft: NodeDraft = {
    detail,
    eyebrow: "Scope",
    id: `signal:${normalizeToken(label)}`,
    kind: "signal",
    label,
    score
  };
  addNode(nodes, draft);
  return draft;
}

function addEdge(edges: Map<string, GraphEdge>, source: string, target: string, label: string, weight: number) {
  if (source === target) return;
  const id = `${source}->${target}:${normalizeToken(label)}`;
  const existing = edges.get(id);
  if (!existing || weight > existing.weight) {
    edges.set(id, { id, label, source, target, weight });
  }
}

function mandateNode(mandate: Mandate): NodeDraft {
  return {
    detail: [mandate.clientName, mandate.status, mandate.priority].filter(Boolean).join(" / "),
    eyebrow: "Mandate",
    id: mandateNodeId(mandate.id),
    kind: "mandate",
    label: mandate.title,
    score: scoreMandate(mandate, "mandate")
  };
}

function personNode(person: Person): NodeDraft {
  return {
    detail: [person.currentTitle, person.currentOrganization].filter(Boolean).join(" / "),
    eyebrow: "Person",
    id: personNodeId(person.id),
    kind: "person",
    label: person.displayName,
    score: scorePerson(person, "relationship")
  };
}

function bestMandateMatches(person: Person, mandateSignals: { mandate: Mandate; tokens: Set<string> }[], depth: number) {
  const tokens = personTokens(person);
  return mandateSignals
    .map((signal) => ({ mandate: signal.mandate, score: countOverlap(tokens, signal.tokens) }))
    .filter((match) => match.score >= (depth >= 3 ? 1 : 2))
    .sort((left, right) => right.score - left.score)
    .slice(0, depth + 1);
}

function personTokens(person: Person) {
  return new Set(
    normalizeList([
      person.currentOrganization,
      person.geography,
      ...person.sectorTags,
      ...(person.relevantMandates ?? []),
      ...(person.relevantGeographies ?? []),
      ...(person.relevantSectors ?? []),
      ...(person.relevantInstitutions ?? [])
    ])
  );
}

function mandateTokens(mandate: Mandate) {
  return new Set(
    normalizeList([
      mandate.title,
      mandate.clientName,
      mandate.sector,
      mandate.mandateCategory,
      ...(mandate.geography ?? []),
      ...(mandate.jurisdiction ?? []),
      ...(mandate.desiredCounterparties ?? []),
      ...(mandate.targetCounterpartyTypes ?? []),
      ...(mandate.strategicPartners ?? []),
      ...(mandate.tags ?? [])
    ])
  );
}

function normalizeList(values: Array<string | undefined>) {
  return values
    .flatMap((value) => String(value ?? "").split(/[,/]/))
    .map((label) => normalizeToken(label))
    .filter(Boolean);
}

function countOverlap(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) count += 1;
  });
  return count;
}

function scorePerson(person: Person, focus: GraphFocus) {
  const institutionWeight = focus === "institution" ? 4 : 1;
  const mandateWeight = focus === "mandate" ? 4 : 2;
  return (
    person.relationshipStrength * 3 +
    person.mandateMatches * mandateWeight +
    (person.relevantInstitutions?.length ?? 0) * institutionWeight +
    (person.relevantMandates?.length ?? 0) * mandateWeight +
    (person.reviewStatus === "verified" ? 5 : 0)
  );
}

function scoreMandate(mandate: Mandate, focus: GraphFocus) {
  const priorityScore = mandate.priority === "critical" ? 16 : mandate.priority === "high" ? 12 : mandate.priority === "medium" ? 7 : 3;
  const statusScore = mandate.status === "active" ? 10 : mandate.status === "researching" ? 7 : mandate.status === "draft" ? 3 : 0;
  const focusScore = focus === "mandate" ? 10 : 0;
  return priorityScore + statusScore + focusScore + mandate.relevantContacts + (mandate.desiredCounterparties?.length ?? 0);
}

function personLimit(options: GraphOptions) {
  if (options.focus === "people") return Math.min(120, options.maxNodes);
  if (options.focus === "institution") return Math.min(80, Math.ceil(options.maxNodes * 0.48));
  return Math.min(90, Math.ceil(options.maxNodes * 0.58));
}

function mandateLimit(options: GraphOptions) {
  if (options.focus === "mandate") return Math.min(36, Math.ceil(options.maxNodes * 0.36));
  return Math.min(28, Math.ceil(options.maxNodes * 0.26));
}

function roleLimit(options: GraphOptions) {
  return options.focus === "institution" ? 500 : 260;
}

function personNodeId(id: string) {
  return `person:${id}`;
}

function mandateNodeId(id: string) {
  return `mandate:${id}`;
}

function organizationNodeId(label: string) {
  return `organization:${normalizeToken(label)}`;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
}

function classifySignal(label: string) {
  if (/\b(africa|america|asia|europe|london|brazil|singapore|ghana|nigeria|kingdom|states|west|gulf|mena)\b/i.test(label)) {
    return "Geography";
  }
  if (/\b(buyer|investor|capital|government|ministry|fund|bank|family office)\b/i.test(label)) return "Counterparty type";
  return "Sector";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
