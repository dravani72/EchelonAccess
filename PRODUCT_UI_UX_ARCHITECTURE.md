# EchelonAccess Product UI/UX Architecture

## Product Definition

EchelonAccess is a private relationship intelligence platform for elite-network deal origination. It converts business-card archives, contact history, institutional memory, and public career movement into a living relationship-management system.

This is not a conventional CRM. It should function as a private intelligence desk for tracking people, organizations, roles, introductions, relationship strength, institutional movement, source evidence, and deal relevance over time.

The central product question is:

> Who do I know, why do they matter now, how strong is the relationship, and what can I credibly ask them to help make happen?

The product must emphasize precision, source awareness, historical continuity, human review, and a high-trust interface.

## Primary User

The primary user is a relationship-driven operator managing elite business, government, cultural, diplomatic, investor, nonprofit, and institutional contacts.

The user needs to digitize and preserve historical business cards, resolve duplicate identities, track career changes, understand institutional connections, match contacts to client mandates, draft context-aware outreach, maintain follow-up discipline, avoid losing stale high-value contacts, and preserve the context in which each relationship was formed.

The user is not simply managing sales leads. The user is managing strategic access.

## Product Positioning

Working product description:

> A private relationship intelligence system that turns business-card archives and professional memory into a living graph of people, organizations, roles, influence, career movement, and deal relevance.

The visual identity should feel closer to a private diplomatic intelligence desk, elite relationship dossier system, deal origination cockpit, or high-end professional research terminal. It should not feel like a generic sales CRM, lightweight address book, social network clone, marketing automation dashboard, or consumer contact manager.

## Core Design Principles

### Dossier First

Every person and organization should feel like a living dossier, not merely a database row. A contact profile should combine identity, historical roles, source business cards, relationship notes, interaction history, known affiliations, graph connections, deal relevance, and outreach readiness.

### History Is Never Overwritten

The system must preserve old titles, old institutions, old phone numbers, and old affiliations as historical evidence. If a business card says someone was `Deputy Trade Commissioner` in 2012, and current enrichment says they are now `Senior Advisor` at a private fund, both must be retained.

Do not overwrite historical role data with current role data. Current status is a layer on top of historical records.

### Source Awareness

Every important claim should have a source, such as business card OCR, user-entered notes, email interactions, calendar events, public profiles, news articles, enrichment providers, or manual corrections. The UI should display source and confidence where appropriate.

### Human-in-the-Loop

AI and enrichment tools may suggest duplicate matches, current employment, outreach drafts, relationship summaries, contact relevance, and mandate matches. The user must approve important merges, role changes, outreach, and client-sensitive recommendations.

### Dense but Calm

The UI may be information-rich, but it must not feel cluttered. Use strong hierarchy, cards for repeated entities and focused dossier panels, side panels, tabs, filterable tables, timeline views, graph views, source badges, and confidence indicators. Avoid decorative dashboard noise, low-value charts, random metrics, excessive color, and gamified sales styling.

## Recommended Front-End Stack

Use Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack Table, React Hook Form, Zod, Sigma.js and Graphology for large relationship networks, React Flow for deliberate deal-path or introduction-path diagrams, Recharts for standard analytics, Lucide React for icons, dnd-kit for drag-and-drop lists, cmdk for command palette, and Uppy or FilePond for file and business-card upload.

Preferred styling direction: dark-mode capable, neutral and restrained, high-contrast typography, professional spacing, sharp but not harsh, and more intelligence terminal than SaaS toy.

## Core Domain Objects

### Person

Represents the actual human being. A person may have many business cards, roles, organizations, contact methods, interactions, relationships, and mandate matches.

```ts
type Person = {
  id: string;
  canonicalName: string;
  displayName: string;
  honorific?: string;
  aliases: string[];
  notes?: string;
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  trustLevel?: "unknown" | "low" | "moderate" | "high" | "sensitive";
  warmthStatus: "cold" | "weak" | "known" | "warm" | "direct";
  currentPrimaryRoleId?: string;
  primaryEmailId?: string;
  primaryPhoneId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

Relationship strength scale:

- `5`: Can call directly and reasonably expect a response.
- `4`: Warm email likely answered.
- `3`: Knows the user but needs context.
- `2`: Weak historical contact.
- `1`: Card only or no meaningful relationship yet.

### Organization

Represents companies, ministries, agencies, NGOs, funds, embassies, law firms, universities, cultural institutions, media companies, and other entities.

```ts
type Organization = {
  id: string;
  name: string;
  normalizedName: string;
  type:
    | "company"
    | "government"
    | "ngo"
    | "fund"
    | "embassy"
    | "university"
    | "law_firm"
    | "media"
    | "cultural"
    | "other";
  sector?: string;
  country?: string;
  city?: string;
  website?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Role

A role is a time-bound position held by a person at an organization. Roles are critical because the product must track career movement over time.

```ts
type Role = {
  id: string;
  personId: string;
  organizationId: string;
  title: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  sourceIds: string[];
  confidence: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

Important rule: a person's old role should not be deleted or overwritten when a new role is discovered.

### Business Card

Represents the original scanned or uploaded card.

```ts
type BusinessCard = {
  id: string;
  personId?: string;
  organizationId?: string;
  imageUrl: string;
  rawOcrText?: string;
  parsedFields: {
    name?: string;
    title?: string;
    organization?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  scanDate: string;
  estimatedCardDate?: string;
  sourceEvent?: string;
  confidence: number;
  reviewStatus: "unreviewed" | "reviewed" | "needs_attention" | "merged";
  createdAt: string;
  updatedAt: string;
};
```

Business card images should remain accessible from the person dossier. The original artifact has evidentiary value.

### Contact Method

Represents emails, phone numbers, websites, social/profile URLs, assistants, and addresses.

```ts
type ContactMethod = {
  id: string;
  personId?: string;
  organizationId?: string;
  type:
    | "email"
    | "phone"
    | "mobile"
    | "office"
    | "assistant"
    | "website"
    | "linkedin"
    | "address"
    | "other";
  value: string;
  label?: string;
  isPrimary: boolean;
  isCurrent?: boolean;
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

Old emails and old phone numbers should be retained but marked stale when appropriate.

### Interaction

Represents a meeting, email, call, introduction, event encounter, proposal, follow-up, or user note.

```ts
type Interaction = {
  id: string;
  personId?: string;
  organizationId?: string;
  mandateId?: string;
  date: string;
  type:
    | "meeting"
    | "email"
    | "call"
    | "introduction"
    | "event"
    | "proposal"
    | "note"
    | "follow_up"
    | "other";
  summary: string;
  outcome?: string;
  nextStep?: string;
  sentiment?: "positive" | "neutral" | "negative" | "unclear";
  createdAt: string;
  updatedAt: string;
};
```

### Relationship Edge

Represents meaningful connections between people, organizations, mandates, and the user.

```ts
type RelationshipEdge = {
  id: string;
  fromEntityType: "person" | "organization" | "mandate" | "user";
  fromEntityId: string;
  toEntityType: "person" | "organization" | "mandate" | "user";
  toEntityId: string;
  relationshipType:
    | "knows"
    | "worked_at"
    | "introduced_by"
    | "met_at"
    | "advises"
    | "board_member"
    | "investor"
    | "government_affiliation"
    | "relevant_to"
    | "client"
    | "other";
  strength?: number;
  sourceIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Client Mandate

Represents a deal, client need, opportunity, pitch, or mission.

```ts
type Mandate = {
  id: string;
  clientName: string;
  title: string;
  objective: string;
  sector?: string;
  geography?: string[];
  desiredCounterparties?: string[];
  forbiddenContacts?: string[];
  status: "draft" | "researching" | "active" | "paused" | "completed" | "dead";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Mandate Contact Match

Represents a ranked suggestion that a person may be useful for a mandate.

```ts
type MandateContactMatch = {
  id: string;
  mandateId: string;
  personId: string;
  relevanceScore: number;
  warmthScore: number;
  riskLevel: "low" | "medium" | "high" | "unknown";
  reasoning: string;
  suggestedAction:
    | "contact_directly"
    | "request_intro"
    | "research_more"
    | "do_not_contact"
    | "wait";
  draftOutreach?: string;
  reviewedByUser: boolean;
  createdAt: string;
  updatedAt: string;
};
```

## Primary Navigation

Use a persistent left sidebar with a restrained professional structure:

1. Dashboard.
2. People.
3. Organizations.
4. Business Cards.
5. Mandates.
6. Relationship Graph.
7. Outreach Queue.
8. Timeline.
9. Search.
10. Settings.

Global top bar: universal search, command palette trigger, add new button, current workspace/client context, notifications/review queue, and user profile/settings.

## Main Screens

### Dashboard

Purpose: give the user a high-level command view of relationship activity and pending intelligence tasks.

Sections should include cards awaiting review, possible duplicate contacts, contacts with detected employment changes, stale high-value relationships, active client mandates, suggested outreach this week, recently updated people, recent interactions, and high-relevance contacts without recent contact.

Good dashboard metrics include unreviewed cards, suggested merges, active mandates, warm contacts not contacted in 90+ days, recent role changes, high-value stale contacts, and outreach awaiting action. Avoid total contacts as a hero number, random charts with no action, and social-media-style activity feeds.

### People List

A dense, filterable table of people. Use TanStack Table.

Columns: name, current title, current organization, relationship strength, warmth status, last interaction, geography, sector tags, source count, mandate matches, and review status.

Filters: relationship strength, sector, country, organization type, current/former government, current/former finance, stale contact, has business card, has email, has current role, needs review, and relevant to active mandate.

Row click opens the Person Dossier.

### Person Dossier

This is one of the most important screens.

Layout: header, left identity column, main content tabs, and right intelligence/action rail.

Header should show name, current role, current organization, relationship strength badge, warmth status, last contact, and primary action buttons.

Primary actions: add interaction, draft outreach, add role, view graph, and match to mandate.

Left column should show profile summary, contact methods, source business cards, tags, known locations, assistants/gatekeepers, and sensitive notes warning if applicable.

Main tabs: Overview, Timeline, Roles, Relationships, Business Cards, Interactions, Mandate Matches, Notes, and Sources.

Overview tab should include AI-generated relationship summary, user-authored private note, current relevance, best approach, known boundaries, recent changes, top connected organizations, and active mandate matches.

Timeline tab should show a chronological feed of business card creation/import, known roles, meetings, emails, calls, introductions, enrichment updates, proposals, follow-ups, and news/public updates. Timeline items must show source and confidence.

Roles tab should provide a table of all known roles. Never collapse the person into only a current title.

Relationships tab should show direct relationships, mutual contacts, introducers, organization links, known second-degree paths, and relationship strength by edge.

Business Cards tab should show card images, OCR text, parsed fields, and review history.

Mandate Matches tab should show active or historical relevance to client/deal opportunities. Each match should include relevance score, warmth score, reasoning, suggested action, draft outreach, and review state.

### Organization Dossier

Organization pages should mirror person dossiers.

Header: organization name, type, sector, country/city, website, and tags.

Tabs: Overview, People, Roles, Relationship Graph, Mandates, Interactions, and Sources.

Important views: current contacts at organization, former contacts at organization, people who moved from this organization elsewhere, people who moved into this organization, relationship strength distribution, and active mandate relevance.

### Business Card Ingestion

This is a critical workflow. The ingestion flow should feel like a document intelligence review station.

Steps:

1. Upload or scan card image.
2. OCR extracts raw text.
3. AI parses structured fields.
4. System suggests matching person/organization.
5. User approves, edits, merges, or creates new records.
6. System creates business card, person, organization, role, and contact method records as appropriate.
7. Card is marked reviewed.

Screen layout: left card image preview, center extracted OCR text, right parsed structured fields, and bottom/right suggested matches and actions.

Actions: create new person, attach to existing person, merge duplicate, create organization, attach to existing organization, add historical role, mark stale, and mark needs review.

Every OCR field should show confidence. Never silently create a merge.

### Duplicate Review

The duplicate review screen should help the user merge records safely.

Show side-by-side comparison of names, organizations, titles, emails, phones, card images, roles, notes, sources, confidence, and conflicting fields.

Actions: merge, keep separate, mark as possible duplicate later, move card to another person, and move role to another person.

Merge must preserve all source records.

### Mandates

Mandates are client/deal objectives.

Mandate list columns: title, client, sector, geography, status, relevant contacts, outreach sent, next action, and last activity.

Mandate dossier tabs: Overview, Target Profile, Matched Contacts, Outreach, Relationship Paths, Notes, and Activity.

Mandate overview should show objective, client, sector, geography, ideal counterparties, excluded contacts, strategic notes, AI summary, and open tasks.

Matched contacts should rank contacts by relevance, warmth, authority, geography, sector match, prior relationship, and risk. Each match should show a concise explanation and suggested action.

Suggested actions: contact directly, ask mutual contact for intro, research more, do not contact, and wait for better pretext.

### Relationship Graph

The graph is a central feature, but it must be useful rather than decorative. Use Sigma.js and Graphology for large graph exploration.

Node types: User, Person, Organization, Mandate, Country, Sector, and Event.

Edge types: knows, worked at, introduced by, met at, advises, board member, investor, government affiliation, and relevant to mandate.

Graph controls: filter by entity type, relationship strength, time period, sector, country, and mandate; show only direct relationships; show second-degree paths; show former roles; show current roles only; highlight warm paths; and highlight stale but high-value contacts.

Clicking a node opens a side dossier panel.

Graph should support person neighborhood, organization neighborhood, mandate-relevance graph, career-movement graph, and intro-path graph.

Do not load the entire global graph by default if the dataset is large. Default graph view should be scoped.

### Outreach Queue

Purpose: help the user act on relationship intelligence without losing context.

Queue items: person, mandate, reason for outreach, suggested channel, draft message, last contact, relationship strength, risk level, due date, and status.

Statuses: draft needed, draft ready, awaiting approval, sent, follow-up needed, paused, and closed.

Outreach should always be reviewable before sending. Never automate sensitive outreach without user approval.

### Global Search

Search should be powerful. The user should be able to search person name, organization, old title, current title, sector, country, card text, notes, interaction summaries, mandates, email address, and phone number.

Search results should be grouped by entity type. Use the command palette for fast actions.

Example commands: find person, add business card, create mandate, draft outreach, add interaction, merge duplicate, show graph, show stale contacts, and show contacts relevant to mandate.

## AI-Assisted Features

AI should assist, but never replace user judgment.

### Card Parsing

Input: OCR text and card image metadata.

Output: name, title, organization, contact methods, address, suggested sector, suggested country, and confidence score.

### Duplicate Detection

Input: new parsed card and existing people/org records.

Output: possible matches, similarity reasoning, confidence score, and suggested action.

### Person Summary

Generate a concise summary of who they are, how the user knows them, why they matter, current relevance, best next action, and relationship risk or sensitivity.

### Mandate Matching

Input: mandate objective, person roles, organizations, relationship notes, sectors, geography, and interactions.

Output: ranked contact list, relevance reasoning, warmth score, suggested approach, and draft outreach angle.

### Outreach Drafting

Draft outreach using relationship basis, last contact, mandate relevance, appropriate tone, desired ask, and known sensitivities.

Do not allow AI to invent relationship history. If no relationship basis exists, the draft must say so internally and propose a cold or indirect approach.

## UI Component Requirements

### Badges

Use badges for relationship strength, current/former role, government affiliation, finance/investor, source type, confidence, review status, sensitive contact, stale contact, and active mandate match.

### Side Panels

Use side panels for quick contact preview, graph node preview, match reasoning, source inspection, business card preview, and outreach draft preview.

### Tables

Tables must support sorting, filtering, search, column visibility, row selection, bulk actions, export, and saved views.

### Timelines

Timeline items must show date, event type, summary, source, confidence, related entities, and action menu.

### Source Cards

Source cards should display source type, date captured, extracted text, confidence, linked record, and original artifact preview when available.

## Visual Style Direction

The interface should be serious, calm, dense, elegant, fast, professional, dark-mode capable, source-aware, timeline-oriented, and graph-aware.

Avoid oversized SaaS illustrations, playful gradients, cartoon icons, social-network styling, gamified CRM language, decorative charts, and excessive animation.

Use color sparingly. Suggested semantic color usage:

- Blue: neutral information.
- Green: current/verified/ready.
- Amber: needs review/stale/confidence issue.
- Red: sensitive/risk/do not contact.
- Purple: mandate/deal relevance.
- Gray: historical/inactive/archived.

## Suggested Page Layout Pattern

Use a consistent three-zone layout.

### Left Navigation

Persistent app-level navigation.

### Main Work Area

Primary view: table, dossier, graph, timeline, mandate workspace, or ingestion review.

### Right Intelligence Rail

Context-aware panel showing summary, suggested next action, related people, related organizations, active mandates, warnings, sources, and draft outreach.

This right rail is important. It turns the app from a database into an operator's cockpit.

## Essential User Flows

### Add Business Card

1. User uploads card.
2. OCR runs.
3. AI parses fields.
4. App suggests possible person/org matches.
5. User reviews.
6. User creates or attaches records.
7. App creates historical role.
8. App stores original card.
9. App marks card reviewed.

### Review Duplicate

1. App flags possible duplicate.
2. User opens comparison.
3. User reviews records side by side.
4. User merges or rejects.
5. All source artifacts are preserved.
6. Roles and contact methods remain historically intact.

### Match Contacts to Mandate

1. User creates mandate.
2. User defines sector, geography, desired counterparties, and forbidden contacts.
3. App ranks relevant people.
4. User reviews reasoning.
5. User selects contacts.
6. App suggests outreach strategy.
7. User approves or edits draft.
8. Interaction/follow-up records are created.

### Open Person Dossier

1. User searches or clicks a person.
2. Dossier opens.
3. User sees current role, relationship strength, timeline, cards, notes, and mandate relevance.
4. User can draft outreach, add interaction, view graph, or update role.

### Explore Relationship Graph

1. User opens graph from person, organization, or mandate.
2. Graph opens in scoped view.
3. User filters nodes and edges.
4. User clicks node.
5. Side dossier opens.
6. User takes action from side panel.

## Non-Negotiable Product Rules

- Never overwrite historical roles.
- Never merge contacts without user approval.
- Never send outreach without user approval.
- Never hide the source of important claims.
- Never treat OCR as final truth.
- Never make AI-invented relationship claims.
- Preserve the original business-card image.
- Distinguish current information from historical information.
- Make relationship strength explicit.
- Make client/deal relevance explainable.

## Initial MVP Scope

MVP must have authenticated private app, people list, person dossier, organization records, business card upload, OCR text capture, parsed field review, manual correction, duplicate suggestion, historical roles, contact methods, interaction notes, mandate creation, mandate-to-contact matching, outreach draft generation, relationship graph scoped to person or mandate, and global search.

MVP should avoid full email inbox sync, fully automated enrichment, mass outbound campaigns, complex permissions, mobile app, public SaaS billing, and overbuilt analytics dashboard.

## Build Sequence

### Phase 1: Data Foundation

Define schema. Implement people, organizations, roles, business cards, and contact methods. Build manual CRUD screens. Build person dossier. Build organization dossier.

### Phase 2: Card Ingestion

Upload card image. Run OCR. Store raw OCR. Parse structured fields. Build review UI. Attach card to person/org. Create historical role from card.

### Phase 3: Relationship Intelligence

Add interactions. Add relationship edges. Add relationship strength. Build timeline. Add source tracking. Add duplicate review.

### Phase 4: Mandates

Create mandate object. Add mandate dossier. Build contact matching. Show reasoning. Add outreach queue.

### Phase 5: Graph

Implement scoped graph view. Person graph. Organization graph. Mandate graph. Side dossier panel.

### Phase 6: AI Assistance

Person summaries. Mandate match reasoning. Outreach draft generation. Stale contact suggestions. Employment-change review.

## Codex Implementation Notes

When generating code, prefer TypeScript-first implementation, strong types for all domain objects, Zod schemas for validation, React Server Components where appropriate, client components only where interactivity is required, shadcn/ui components for base UI, TanStack Table for dense tables, reusable dossier layout components, reusable source badge components, reusable confidence indicator components, reusable timeline item components, reusable entity preview side panels, and scoped graph rendering rather than loading all nodes.

Avoid hardcoding fake CRM concepts, treating contacts as flat rows, collapsing roles into a single title string, building graph visualization before the data model is stable, building automated outreach before review workflows exist, and building public SaaS features before private usefulness is proven.

## Suggested Directory Structure

```txt
/app
  /dashboard
  /people
  /people/[id]
  /organizations
  /organizations/[id]
  /cards
  /cards/review
  /mandates
  /mandates/[id]
  /graph
  /outreach
  /settings
/components
  /app-shell
  /dossier
  /tables
  /timeline
  /graph
  /cards
  /forms
  /badges
  /sources
  /outreach
  /mandates
/lib
  /db
  /schemas
  /services
  /ai
  /ocr
  /graph
  /matching
  /search
  /utils
/types
  person.ts
  organization.ts
  role.ts
  business-card.ts
  interaction.ts
  mandate.ts
  relationship-edge.ts
  source.ts
```

## First Screens to Build

Build these first:

1. App shell.
2. People table.
3. Person dossier.
4. Business card upload/review screen.
5. Organization dossier.
6. Mandate list.
7. Mandate dossier.
8. Scoped person graph.
9. Outreach queue.

The person dossier and card review screen are the product's center of gravity. If those feel right, the rest of the product can grow naturally.

## Final Product Standard

The application succeeds if it helps the user quickly understand who this person is, how the user knows them, what they used to do, what they do now, why they matter, who they connect to, which client mandate they fit, whether the relationship is warm enough to activate, and what the next move should be.

Every design and engineering decision should support that standard.
