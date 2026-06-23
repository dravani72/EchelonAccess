import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import type { Mandate } from "@/types/domain";

export function MandatesPanel({ mandates }: { mandates: Mandate[] }) {
  return (
    <section className="panel" id="mandates">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Mandate Definition</h2>
          <div className="section-kicker">Scope, boundaries, counterparties, authority path, and disqualification rules.</div>
        </div>
      </div>
      <div className="panel-body" style={{ display: "grid", gap: 14 }}>
        {mandates.map((mandate) => (
          <article className={`review-section ${mandate.isMockData ? "mock-record" : ""}`} key={mandate.id}>
            <div className="review-section-header">
              <div>
                <div className="field-label">{mandate.clientName}</div>
                <div className="review-match-name">{mandate.title}</div>
                <p className="review-note">{mandate.objective}</p>
              </div>
              <div className="badge-row">
                <Badge tone={mandate.status === "active" ? "green" : mandate.status === "researching" ? "amber" : "blue"}>
                  {formatStatus(mandate.status)}
                </Badge>
                {mandate.priority ? <Badge tone={mandate.priority === "critical" || mandate.priority === "high" ? "red" : "purple"}>{formatStatus(mandate.priority)}</Badge> : null}
                <Badge tone="blue">{mandate.relevantContacts} contacts</Badge>
              </div>
            </div>

            <div className="parsed-fields" style={{ marginTop: 12 }}>
              <DefinitionLine label="Next action" value={mandate.nextAction} />
              <DefinitionLine label="Next milestone" value={mandate.nextMilestone} />
              <DefinitionLine label="Owner" value={mandate.owner} />
              <DefinitionLine label="Last reviewed" value={mandate.lastReviewedDate} />
            </div>

            <DefinitionSection
              rows={[
                ["Category", mandate.mandateCategory],
                ["Deal type", mandate.dealType],
                ["Ask type", mandate.askType],
                ["Transaction", mandate.transactionType],
                ["Sector", mandate.sector],
                ["Geography", mandate.geography?.join(", ")],
                ["Jurisdiction", mandate.jurisdiction?.join(", ")],
                ["Stage", mandate.transactionStage],
                ["Timeline", mandate.timeline],
                ["Urgency", mandate.urgency ? formatStatus(mandate.urgency) : undefined],
                ["Decision deadline", mandate.decisionDeadline],
                ["Close target", mandate.closeTargetDate]
              ]}
              title="Mandate Scope"
            />
            <DefinitionSection
              rows={[
                ["Client profile", mandate.clientProfile],
                ["Sponsor profile", mandate.sponsorProfile],
                ["Capital type", mandate.capitalType],
                ["Capital stack", mandate.capitalStack],
                ["Target amount", mandate.targetAmount],
                ["Minimum ticket", mandate.minimumTicket],
                ["Currency", mandate.currency],
                ["Economics", mandate.economics],
                ["Fee model", mandate.feeModel]
              ]}
              title="Capital And Economics"
            />
            <DefinitionSection
              rows={[
                ["Target counterparty types", mandate.targetCounterpartyTypes?.join(", ")],
                ["Desired counterparties", mandate.desiredCounterparties?.join(", ")],
                ["Forbidden contacts", mandate.forbiddenContacts?.join(", ")],
                ["Buyer universe", mandate.buyerUniverse?.join(", ")],
                ["Investor universe", mandate.investorUniverse?.join(", ")],
                ["Strategic partners", mandate.strategicPartners?.join(", ")]
              ]}
              title="Counterparty Universe"
            />
            <DefinitionSection
              rows={[
                ["Relationship thesis", mandate.relationshipThesis],
                ["Access strategy", mandate.accessStrategy],
                ["Outreach angle", mandate.outreachAngle],
                ["Value proposition", mandate.valueProposition],
                ["Decision makers", mandate.decisionMakers?.join(", ")],
                ["Gatekeepers", mandate.gatekeepers?.join(", ")],
                ["Influencers", mandate.influencers?.join(", ")],
                ["Government touchpoints", mandate.governmentTouchpoints?.join(", ")],
                ["Required approvals", mandate.requiredApprovals?.join(", ")]
              ]}
              title="Authority And Access Path"
            />
            <DefinitionSection
              rows={[
                ["Regulatory regime", mandate.regulatoryRegime],
                ["Compliance requirements", mandate.complianceRequirements],
                ["Sanctions exposure", mandate.sanctionsExposure],
                ["Political exposure", mandate.politicalExposure],
                ["Procurement process", mandate.procurementProcess],
                ["Confidentiality", mandate.confidentialityLevel ? formatStatus(mandate.confidentialityLevel) : undefined],
                ["Conflict constraints", mandate.conflictConstraints],
                ["Risks", mandate.risks],
                ["Blockers", mandate.blockers]
              ]}
              title="Constraints And Risk"
            />
            <DefinitionSection
              rows={[
                ["Proof points", mandate.proofPoints?.join(", ")],
                ["Materials required", mandate.materialsRequired?.join(", ")],
                ["Diligence requirements", mandate.diligenceRequirements?.join(", ")],
                ["Data room status", mandate.dataRoomStatus],
                ["Competitive landscape", mandate.competitiveLandscape],
                ["Incumbent relationships", mandate.incumbentRelationships],
                ["Open questions", mandate.openQuestions?.join(", ")],
                ["Success criteria", mandate.successCriteria?.join(", ")],
                ["Disqualification criteria", mandate.disqualificationCriteria?.join(", ")],
                ["Tags", mandate.tags?.join(", ")],
                ["Notes", mandate.notes],
                ["Source confidence", mandate.sourceConfidence === undefined ? undefined : `${Math.round(mandate.sourceConfidence * 100)}%`]
              ]}
              title="Evidence And Qualification"
            />
          </article>
        ))}
        {!mandates.length ? <div className="empty-state">No mandates have been defined yet.</div> : null}
      </div>
    </section>
  );
}

function DefinitionSection({ rows, title }: { rows: Array<[string, string | undefined]>; title: string }) {
  const visibleRows = rows.filter(([, value]) => value);

  if (!visibleRows.length) {
    return null;
  }

  return (
    <details className="mandate-morphology">
      <summary>{title}</summary>
      <div className="mandate-detail-grid">
        {visibleRows.map(([label, value]) => (
          <div className="mandate-detail" key={label}>
            <div className="field-label">{label}</div>
            <div className="field-value">{value}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function DefinitionLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
