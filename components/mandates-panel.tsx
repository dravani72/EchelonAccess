import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import type { Mandate } from "@/types/domain";

export function MandatesPanel({ mandates }: { mandates: Mandate[] }) {
  return (
    <section className="panel" id="Mandates">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Mandates</h2>
          <div className="section-kicker">Deal objectives ranked by relationship access and next action.</div>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mandate</th>
              <th>Client</th>
              <th>Sector</th>
              <th>Status</th>
              <th>Relevant Contacts</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {mandates.map((mandate) => (
              <tr className={mandate.isMockData ? "mock-record" : undefined} key={mandate.id}>
                <td>
                  <span className="person-name">{mandate.title}</span>
                  <div className="muted">{mandate.objective}</div>
                  <MandateMorphology mandate={mandate} />
                </td>
                <td>{mandate.clientName}</td>
                <td>{mandate.sector}</td>
                <td>
                  <Badge tone={mandate.status === "active" ? "green" : mandate.status === "researching" ? "amber" : "blue"}>
                    {formatStatus(mandate.status)}
                  </Badge>
                </td>
                <td>
                  <Badge tone="purple">{mandate.relevantContacts}</Badge>
                </td>
                <td>{mandate.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MandateMorphology({ mandate }: { mandate: Mandate }) {
  const rows = [
    ["Deal Type", mandate.dealType],
    ["Ask Type", mandate.askType],
    ["Transaction", mandate.transactionType],
    ["Category", mandate.mandateCategory],
    ["Client Profile", mandate.clientProfile],
    ["Sponsor Profile", mandate.sponsorProfile],
    ["Counterparties", mandate.targetCounterpartyTypes?.join(", ")],
    ["Desired", mandate.desiredCounterparties?.join(", ")],
    ["Forbidden", mandate.forbiddenContacts?.join(", ")],
    ["Capital", [mandate.capitalType, mandate.capitalStack, mandate.targetAmount].filter(Boolean).join(" | ")],
    ["Economics", mandate.economics],
    ["Fee Model", mandate.feeModel],
    ["Stage", mandate.transactionStage],
    ["Timeline", mandate.timeline],
    ["Urgency", mandate.urgency],
    ["Jurisdiction", mandate.jurisdiction?.join(", ")],
    ["Regulatory", mandate.regulatoryRegime],
    ["Compliance", mandate.complianceRequirements],
    ["Sanctions", mandate.sanctionsExposure],
    ["Political Exposure", mandate.politicalExposure],
    ["Procurement", mandate.procurementProcess],
    ["Government Touchpoints", mandate.governmentTouchpoints?.join(", ")],
    ["Approvals", mandate.requiredApprovals?.join(", ")],
    ["Decision Makers", mandate.decisionMakers?.join(", ")],
    ["Gatekeepers", mandate.gatekeepers?.join(", ")],
    ["Influencers", mandate.influencers?.join(", ")],
    ["Buyer Universe", mandate.buyerUniverse?.join(", ")],
    ["Investor Universe", mandate.investorUniverse?.join(", ")],
    ["Strategic Partners", mandate.strategicPartners?.join(", ")],
    ["Relationship Thesis", mandate.relationshipThesis],
    ["Access Strategy", mandate.accessStrategy],
    ["Outreach Angle", mandate.outreachAngle],
    ["Value Proposition", mandate.valueProposition],
    ["Proof Points", mandate.proofPoints?.join(", ")],
    ["Materials", mandate.materialsRequired?.join(", ")],
    ["Diligence", mandate.diligenceRequirements?.join(", ")],
    ["Data Room", mandate.dataRoomStatus],
    ["Confidentiality", mandate.confidentialityLevel ? formatStatus(mandate.confidentialityLevel) : undefined],
    ["Conflicts", mandate.conflictConstraints],
    ["Competitive Landscape", mandate.competitiveLandscape],
    ["Incumbents", mandate.incumbentRelationships],
    ["Risks", mandate.risks],
    ["Blockers", mandate.blockers],
    ["Open Questions", mandate.openQuestions?.join(", ")],
    ["Success Criteria", mandate.successCriteria?.join(", ")],
    ["Disqualification", mandate.disqualificationCriteria?.join(", ")],
    ["Next Milestone", mandate.nextMilestone],
    ["Owner", mandate.owner],
    ["Priority", mandate.priority],
    ["Confidence", mandate.sourceConfidence === undefined ? undefined : `${Math.round(mandate.sourceConfidence * 100)}%`],
    ["Last Reviewed", mandate.lastReviewedDate],
    ["Tags", mandate.tags?.join(", ")],
    ["Notes", mandate.notes]
  ].filter(([, value]) => value);

  if (!rows.length) {
    return null;
  }

  return (
    <details className="mandate-morphology">
      <summary>Deal morphology</summary>
      <div className="mandate-detail-grid">
        {rows.map(([label, value]) => (
          <div className="mandate-detail" key={label}>
            <div className="field-label">{label}</div>
            <div className="field-value">{value}</div>
          </div>
        ))}
      </div>
    </details>
  );
}
