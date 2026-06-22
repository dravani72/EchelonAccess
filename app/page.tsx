import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { IntelligenceRail } from "@/components/intelligence-rail";
import { MandatesPanel } from "@/components/mandates-panel";
import { Metrics } from "@/components/metrics";
import { OutreachQueue } from "@/components/outreach-queue";
import { PeopleTable } from "@/components/people-table";
import { PersonDossier } from "@/components/person-dossier";
import { RelationshipGraph } from "@/components/relationship-graph";
import { RelationshipIntake } from "@/components/relationship-intake";
import { ReviewStation } from "@/components/review-station";

export default function Home() {
  return (
    <AccessGate>
      <AppShell>
        <div className="page">
          <div className="stack">
            <section>
              <h1 className="section-title">Relationship Intelligence Desk</h1>
              <p className="section-kicker">Source-aware dossiers, mandate matching, graph paths, and reviewed outreach for strategic access.</p>
            </section>
            <Metrics />
            <RelationshipIntake />
            <PeopleTable />
            <PersonDossier />
            <div className="grid-two">
              <ReviewStation />
              <RelationshipGraph />
            </div>
            <MandatesPanel />
            <OutreachQueue />
          </div>
          <IntelligenceRail />
        </div>
      </AppShell>
    </AccessGate>
  );
}
