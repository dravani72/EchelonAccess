import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { IntelligenceRail } from "@/components/intelligence-rail";
import { Metrics } from "@/components/metrics";
import { ResponsiveWorkspace } from "@/components/responsive-workspace";
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
              <h1 className="section-title">Relationship Workspace</h1>
              <p className="section-kicker">
                Open focused modules for connection mapping, introduction scoring, people records, mandate definition, organization scope, and outreach review.
              </p>
            </section>

            <Metrics data={data} />
            <ResponsiveWorkspace data={data} />
          </div>
          <IntelligenceRail data={data} />
        </div>
      </AppShell>
    </AccessGate>
  );
}
