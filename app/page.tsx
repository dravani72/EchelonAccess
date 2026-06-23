import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { IntelligenceRail } from "@/components/intelligence-rail";
import { MandatesPanel } from "@/components/mandates-panel";
import { Metrics } from "@/components/metrics";
import { OutreachQueue } from "@/components/outreach-queue";
import { PeopleTable } from "@/components/people-table";
import { PersonDossier } from "@/components/person-dossier";
import { RelationshipIntake } from "@/components/relationship-intake";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getAppData();

  return (
    <AccessGate>
      <AppShell>
        <div className="page">
          <div className="stack">
            <section>
              <h1 className="section-title">Relationship Intelligence Desk</h1>
              <p className="section-kicker">
                Source-aware dossiers, mandate matching, graph paths, and reviewed outreach for strategic access.
              </p>
            </section>

            <Metrics data={data} />
            <RelationshipIntake source={data.source} workspaceId={data.currentWorkspace?.id} />
            <PeopleTable
              mandates={data.mandates}
              outreachQueue={data.outreachQueue}
              people={data.people}
              roles={data.roles}
              source={data.source}
            />
            <PersonDossier
              businessCards={data.businessCards}
              interactions={data.interactions}
              people={data.people}
              roles={data.roles}
            />
            <MandatesPanel mandates={data.mandates} />
            <OutreachQueue outreachQueue={data.outreachQueue} />
          </div>
          <IntelligenceRail data={data} />
        </div>
      </AppShell>
    </AccessGate>
  );
}
