import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ARTIFACT_BUCKET = "relationship-artifacts";
const getSupabase = () => createSupabaseBrowserClient() as any;

type IntelligenceInput = {
  trustLevel?: "unknown" | "low" | "moderate" | "high" | "sensitive" | "";
  opposition?: string;
  nationality?: string;
  languages?: string[];
  publicPrivateStatus?: string;
  influenceType?: string;
  accessPath?: string;
  relationshipOwner?: string;
  bestApproach?: string;
  currentAuthority?: string;
  historicalAuthority?: string;
  sensitivityLevel?: "low" | "moderate" | "high" | "sensitive" | "";
  motivations?: string;
  constraints?: string;
  relevantMandates?: string[];
  relevantGeographies?: string[];
  relevantSectors?: string[];
  relevantInstitutions?: string[];
  keyRelationships?: string;
  doNotDiscuss?: string;
  bestNextMove?: string;
  sourceConfidence?: number | null;
  lastVerifiedDate?: string;
};

type CreateRelationshipInput = {
  workspaceId: string;
  name: string;
  organization?: string;
  title?: string;
  notes?: string;
  cardFile?: File | null;
  rawOcrText?: string;
  parsedCardFields?: Record<string, unknown>;
  cardConfidence?: number | null;
  cardReviewed?: boolean;
  avatarFile?: File | null;
} & IntelligenceInput;

type UpdatePersonInput = {
  displayName: string;
  currentTitle: string;
  currentOrganization: string;
  relationshipStrength: number;
  warmthStatus: "cold" | "weak" | "known" | "warm" | "direct";
  notes?: string;
} & IntelligenceInput;

export async function createRelationship(input: CreateRelationshipInput) {
  const supabase = getSupabase();
  const canonicalName = input.name.trim();

  if (!canonicalName) {
    throw new Error("Person name is required.");
  }

  const [avatarPath, cardPath] = await Promise.all([
    input.avatarFile ? uploadArtifact(input.workspaceId, "avatars", input.avatarFile) : Promise.resolve(null),
    input.cardFile ? uploadArtifact(input.workspaceId, "business-cards", input.cardFile) : Promise.resolve(null)
  ]);

  const { data: person, error: personError } = await supabase
    .from("people")
    .insert({
      workspace_id: input.workspaceId,
      canonical_name: canonicalName,
      display_name: canonicalName,
      current_organization: input.organization?.trim() || null,
      current_title: input.title?.trim() || null,
      avatar_url: avatarPath,
      notes: input.notes?.trim() || null,
      ...buildIntelligencePayload(input),
      source_count: cardPath ? 1 : 0,
      review_status: cardPath && !input.cardReviewed ? "needs_review" : "verified"
    })
    .select("id")
    .single();

  if (personError || !person) {
    if (personError?.message.toLowerCase().includes("avatar_url")) {
      throw new Error("The people.avatar_url column is missing from Supabase schema cache. Run supabase/people-assets.sql in Supabase SQL Editor.");
    }

    if (hasMissingIntelligenceColumn(personError?.message)) {
      throw new Error("One or more people intelligence columns are missing from Supabase schema cache. Run supabase/people-intelligence-fields.sql in Supabase SQL Editor.");
    }

    throw new Error(personError?.message ?? "Could not create relationship.");
  }

  if (input.organization?.trim() && input.title?.trim()) {
    const { error: roleError } = await supabase.from("roles").insert({
      workspace_id: input.workspaceId,
      person_id: person.id,
      organization_name: input.organization.trim(),
      title: input.title.trim(),
      is_current: true,
      confidence: 0.7,
      source_label: cardPath ? "Business card upload" : "Manual entry"
    });

    if (roleError) {
      throw new Error(roleError.message);
    }
  }

  if (cardPath) {
    const { error: cardError } = await supabase.from("business_cards").insert({
      workspace_id: input.workspaceId,
      person_id: person.id,
      image_url: cardPath,
      parsed_fields: {
        ...(input.parsedCardFields ?? {}),
        name: canonicalName,
        organization: input.organization?.trim() || null,
        title: input.title?.trim() || null,
        artifactRetention: {
          originalUploaded: false,
          storedArtifact: "normalized_image",
          normalizedMimeType: input.cardFile?.type ?? null
        }
      },
      raw_ocr_text: cleanText(input.rawOcrText),
      source_event: "UI upload",
      confidence: input.cardConfidence ?? 0.35,
      review_status: input.cardReviewed ? "reviewed" : "unreviewed"
    });

    if (cardError) {
      throw new Error(cardError.message);
    }
  }

  return person.id;
}

export async function updatePerson(personId: string, input: UpdatePersonInput) {
  const supabase = getSupabase();
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("Person name is required.");
  }

  const { error } = await supabase
    .from("people")
    .update({
      canonical_name: displayName,
      display_name: displayName,
      current_title: input.currentTitle.trim() || null,
      current_organization: input.currentOrganization.trim() || null,
      relationship_strength: input.relationshipStrength,
      warmth_status: input.warmthStatus,
      notes: input.notes?.trim() || null,
      ...buildIntelligencePayload(input),
      updated_at: new Date().toISOString()
    })
    .eq("id", personId);

  if (error) {
    if (hasMissingIntelligenceColumn(error.message)) {
      throw new Error("One or more people intelligence columns are missing from Supabase schema cache. Run supabase/people-intelligence-fields.sql in Supabase SQL Editor.");
    }

    throw new Error(error.message);
  }
}

function buildIntelligencePayload(input: IntelligenceInput) {
  return {
    opposition: cleanText(input.opposition),
    trust_level: input.trustLevel || null,
    nationality: cleanText(input.nationality),
    languages: input.languages ?? [],
    public_private_status: cleanText(input.publicPrivateStatus),
    influence_type: cleanText(input.influenceType),
    access_path: cleanText(input.accessPath),
    relationship_owner: cleanText(input.relationshipOwner),
    best_approach: cleanText(input.bestApproach),
    current_authority: cleanText(input.currentAuthority),
    historical_authority: cleanText(input.historicalAuthority),
    sensitivity_level: input.sensitivityLevel || null,
    motivations: cleanText(input.motivations),
    constraints: cleanText(input.constraints),
    relevant_mandates: input.relevantMandates ?? [],
    relevant_geographies: input.relevantGeographies ?? [],
    relevant_sectors: input.relevantSectors ?? [],
    relevant_institutions: input.relevantInstitutions ?? [],
    key_relationships: cleanText(input.keyRelationships),
    do_not_discuss: cleanText(input.doNotDiscuss),
    best_next_move: cleanText(input.bestNextMove),
    source_confidence: input.sourceConfidence ?? null,
    last_verified_date: input.lastVerifiedDate?.trim() || null
  };
}

function cleanText(value?: string) {
  return value?.trim() || null;
}

function hasMissingIntelligenceColumn(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return [
    "opposition",
    "nationality",
    "languages",
    "public_private_status",
    "influence_type",
    "access_path",
    "relationship_owner",
    "best_approach",
    "current_authority",
    "historical_authority",
    "sensitivity_level",
    "motivations",
    "constraints",
    "relevant_mandates",
    "relevant_geographies",
    "relevant_sectors",
    "relevant_institutions",
    "key_relationships",
    "do_not_discuss",
    "best_next_move",
    "source_confidence",
    "last_verified_date"
  ].some((column) => normalized.includes(column));
}

export async function deletePerson(personId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("people").update({ deleted_at: new Date().toISOString() }).eq("id", personId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function stageContactImport(workspaceId: string, file: File) {
  const supabase = getSupabase();
  const importPath = await uploadArtifact(workspaceId, "contact-imports", file);
  const { error } = await supabase.from("review_tasks").insert({
    workspace_id: workspaceId,
    title: "Contact import ready for review",
    detail: `${file.name} uploaded to ${importPath}. Review before merging imported contacts.`,
    status: "needs_review"
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("Storage bucket relationship-artifacts was not found. Run supabase/storage.sql in Supabase SQL Editor.");
    }

    throw new Error(error.message);
  }

  return importPath;
}

export async function uploadArtifact(workspaceId: string, folder: "avatars" | "business-cards" | "contact-imports", file: File) {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExtension = extension?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  const path = `${workspaceId}/${folder}/${crypto.randomUUID()}.${safeExtension}`;
  const { error } = await supabase.storage.from(ARTIFACT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
