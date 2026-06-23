import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { RelationshipIntake } from "@/components/relationship-intake";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewRelationshipPage() {
  const data = await getAppData();

  return (
    <AccessGate>
      <AppShell activeSection="add">
        <div className="page" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div className="stack">
            <section>
              <h1 className="section-title">Define Relationship</h1>
              <p className="section-kicker">
                Capture the person, evidence source, mandate relevance, access path, and interrelationship context in one place.
              </p>
            </section>

            <RelationshipIntake source={data.source} workspaceId={data.currentWorkspace?.id} />
          </div>
        </div>
      </AppShell>
    </AccessGate>
  );
}
