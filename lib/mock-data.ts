import type { Interaction, Mandate, Organization, OutreachItem, Person, ReviewTask, Role } from "@/types/domain";

export const people: Person[] = [
  { id: "p-amelia-hart", canonicalName: "Amelia Hart", displayName: "Amelia Hart", aliases: ["A. Hart"], relationshipStrength: 5, trustLevel: "high", warmthStatus: "direct", currentTitle: "Partner, Strategic Infrastructure", currentOrganization: "Northbridge Capital", lastInteraction: "2026-05-18", geography: "London / New York", sectorTags: ["Infrastructure", "Energy", "Sovereign"], sourceCount: 9, mandateMatches: 3, reviewStatus: "verified", notes: "Can be approached directly when the ask is precise and well-framed." },
  { id: "p-rafael-santos", canonicalName: "Rafael Santos", displayName: "Rafael Santos", aliases: ["Rafa Santos"], relationshipStrength: 4, trustLevel: "moderate", warmthStatus: "warm", currentTitle: "Senior Advisor", currentOrganization: "Ministry of Trade, Brazil", lastInteraction: "2026-03-07", geography: "Brasilia", sectorTags: ["Government", "Trade", "Latin America"], sourceCount: 6, mandateMatches: 2, reviewStatus: "needs_review", notes: "Historical card indicates prior private-sector role that may matter for energy mandate." },
  { id: "p-maya-chen", canonicalName: "Maya Chen", displayName: "Maya Chen", aliases: [], relationshipStrength: 3, trustLevel: "moderate", warmthStatus: "known", currentTitle: "Managing Director", currentOrganization: "Harborline Growth", lastInteraction: "2025-11-12", geography: "Singapore", sectorTags: ["Growth Equity", "Logistics", "APAC"], sourceCount: 4, mandateMatches: 1, reviewStatus: "verified", notes: "Best reached through an event-specific pretext or a mutual Asia logistics contact." },
  { id: "p-james-okafor", canonicalName: "James Okafor", displayName: "James Okafor", aliases: ["J. Okafor"], relationshipStrength: 2, trustLevel: "unknown", warmthStatus: "weak", currentTitle: "Board Member", currentOrganization: "Atlantic Development Bank", lastInteraction: "2024-09-22", geography: "Accra / Lagos", sectorTags: ["Development Finance", "Ports", "Africa"], sourceCount: 3, mandateMatches: 2, reviewStatus: "possible_duplicate", notes: "Two cards may be the same person with title progression." }
];

export const organizations: Organization[] = [
  { id: "o-northbridge", name: "Northbridge Capital", normalizedName: "northbridge capital", type: "fund", sector: "Infrastructure", country: "United Kingdom", city: "London", tags: ["fund", "infrastructure", "energy"] },
  { id: "o-trade-brazil", name: "Ministry of Trade, Brazil", normalizedName: "ministry of trade brazil", type: "government", sector: "Trade", country: "Brazil", city: "Brasilia", tags: ["government", "latin-america"] },
  { id: "o-harborline", name: "Harborline Growth", normalizedName: "harborline growth", type: "fund", sector: "Growth Equity", country: "Singapore", city: "Singapore", tags: ["apac", "logistics", "fund"] }
];

export const roles: Role[] = [
  { id: "r-1", personId: "p-amelia-hart", organizationName: "Northbridge Capital", title: "Partner, Strategic Infrastructure", startDate: "2023", isCurrent: true, confidence: 0.92, sourceLabel: "Manual update" },
  { id: "r-2", personId: "p-amelia-hart", organizationName: "UK Department for Business and Trade", title: "Deputy Trade Commissioner", startDate: "2012", endDate: "2018", isCurrent: false, confidence: 0.86, sourceLabel: "Business card OCR" },
  { id: "r-3", personId: "p-amelia-hart", organizationName: "Helios Energy Group", title: "Head of Public-Private Partnerships", startDate: "2018", endDate: "2023", isCurrent: false, confidence: 0.78, sourceLabel: "Public profile" }
];

export const interactions: Interaction[] = [
  { id: "i-1", personId: "p-amelia-hart", date: "2026-05-18", type: "call", summary: "Discussed sovereign-backed port modernization mandate and likely counterparties.", outcome: "Open to a specific one-page ask.", nextStep: "Send targeted brief after mandate terms are tightened.", confidence: 0.95, sourceLabel: "User note" },
  { id: "i-2", personId: "p-amelia-hart", date: "2025-10-04", type: "event", summary: "Reconnected at infrastructure forum; mentioned move from energy advisory into fund role.", confidence: 0.84, sourceLabel: "Event note" },
  { id: "i-3", personId: "p-amelia-hart", date: "2012", type: "note", summary: "Original card captured Deputy Trade Commissioner title and London office number.", confidence: 0.76, sourceLabel: "Business card OCR" }
];

export const mandates: Mandate[] = [
  { id: "m-port-modernization", clientName: "Confidential infrastructure client", title: "Port Modernization Capital Path", objective: "Identify warm government and fund counterparties for port modernization financing.", sector: "Infrastructure", geography: ["West Africa", "United Kingdom"], status: "active", relevantContacts: 11, nextAction: "Approve outreach angle for Amelia Hart" },
  { id: "m-energy-transition", clientName: "Energy transition sponsor", title: "Latin America Energy Introductions", objective: "Map trade and energy-policy access points for regional expansion.", sector: "Energy", geography: ["Brazil", "Chile"], status: "researching", relevantContacts: 7, nextAction: "Resolve Rafael Santos role history" },
  { id: "m-apac-logistics", clientName: "APAC logistics operator", title: "Strategic Growth Equity Access", objective: "Find investor and sovereign logistics paths across Singapore and Indonesia.", sector: "Logistics", geography: ["Singapore", "Indonesia"], status: "draft", relevantContacts: 5, nextAction: "Define forbidden contacts before matching" }
];

export const outreachQueue: OutreachItem[] = [
  { id: "q-1", personName: "Amelia Hart", mandateTitle: "Port Modernization Capital Path", reason: "Direct relationship with infrastructure mandate fit and fund authority.", channel: "email", relationshipStrength: 5, riskLevel: "low", dueDate: "2026-06-25", status: "draft_ready" },
  { id: "q-2", personName: "Rafael Santos", mandateTitle: "Latin America Energy Introductions", reason: "Government trade role maps to energy market access, but current authority needs review.", channel: "intro_request", relationshipStrength: 4, riskLevel: "medium", dueDate: "2026-06-28", status: "awaiting_approval" },
  { id: "q-3", personName: "James Okafor", mandateTitle: "Port Modernization Capital Path", reason: "Possible development-finance path, but duplicate identity must be resolved first.", channel: "email", relationshipStrength: 2, riskLevel: "unknown", dueDate: "2026-07-01", status: "draft_needed" }
];

export const reviewTasks: ReviewTask[] = [
  { id: "t-1", title: "Rafael Santos role change", detail: "Public profile suggests new ministry title; preserve prior private-sector card role.", status: "needs_review" },
  { id: "t-2", title: "James Okafor duplicate", detail: "Two card scans share phone number but differ by organization and date.", status: "suggested" },
  { id: "t-3", title: "Maya Chen stale contact", detail: "Known contact with active APAC mandate relevance and no interaction in 7 months.", status: "stale" }
];
