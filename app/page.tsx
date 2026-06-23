import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { Metrics } from "@/components/metrics";
import { ResponsiveWorkspace } from "@/components/responsive-workspace";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getAppData();

  return (
    <AccessGate>
      <AppShell>
        <div className="page" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div className="stack">
            <section>
              <h1 className="section-title">Relationship Intelligence Desk</h1>
              <p className="section-kicker">
                Source-aware dossiers, mandate matching, graph paths, and reviewed outreach for strategic access.
              </p>
            </section>

            <Metrics data={data} />
            <ResponsiveWorkspace data={data} />
          </div>
        </div>
      </AppShell>
    </AccessGate>
  );
}
