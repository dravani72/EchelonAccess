import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ARTIFACT_BUCKET = "relationship-artifacts";
const getSupabase = () => createSupabaseBrowserClient() as any;

type CreateRelationshipInput = {
  workspaceId: string;
  name: string;
  organization?: string;
  title?: string;
  notes?: string;
  cardFile?: File | null;
  avatarFile?: File | null;
};

type UpdatePersonInput = {
  displayName: string;
  currentTitle: string;
  currentOrganization: string;
  relationshipStrength: number;
  warmthStatus: "cold" | "weak" | "known" | "warm" | "direct";
  notes?: string;
};

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
      source_count: cardPath ? 1 : 0,
      review_status: cardPath ? "needs_review" : "verified"
    })
    .select("id")
    .single();

  if (personError || !person) {
    if (personError?.message.toLowerCase().includes("avatar_url")) {
      throw new Error("The people.avatar_url column is missing from Supabase schema cache. Run supabase/people-assets.sql in Supabase SQL Editor.");
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
        name: canonicalName,
        organization: input.organization?.trim() || null,
        title: input.title?.trim() || null
      },
      source_event: "UI upload",
      confidence: 0.35,
      review_status: "unreviewed"
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
      updated_at: new Date().toISOString()
    })
    .eq("id", personId);

  if (error) {
    throw new Error(error.message);
  }
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
