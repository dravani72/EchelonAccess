import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { MandateIntake } from "@/components/mandate-intake";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewMandatePage() {
  const data = await getAppData();

  return (
    <AccessGate>
      <AppShell activeSection="define-mandate">
        <div className="page" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div className="stack">
            <section>
              <h1 className="section-title">Define Mandate</h1>
              <p className="section-kicker">
                Capture the project, directive, authority path, counterparty universe, constraints, and evidence needed to develop
                relationships responsibly.
              </p>
            </section>

            <MandateIntake source={data.source} workspaceId={data.currentWorkspace?.id} />
          </div>
        </div>
      </AppShell>
    </AccessGate>
  );
}
