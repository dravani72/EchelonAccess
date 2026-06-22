import { Badge } from "@/components/badge";

export function ReviewStation() {
  return (
    <section className="panel" id="Business Cards">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Business Card Review Station</h2>
          <div className="section-kicker">OCR is evidence, not truth. Merges require approval.</div>
        </div>
        <Badge tone="amber">Needs review</Badge>
      </div>
      <div className="panel-body">
        <div className="review-layout">
          <div className="card-preview">
            <div>
              <strong>Card image</strong>
              <div className="muted">Original artifact retained</div>
            </div>
          </div>
          <div className="ocr-box">
            Amelia Hart
            <br />
            Deputy Trade Commissioner
            <br />
            UK Department for Business and Trade
            <br />
            London Office
            <br />
            amelia.hart@example.gov.uk
          </div>
          <div className="stack">
            <div className="identity-card">
              <div className="field-label">Suggested Match</div>
              <div className="identity-name">Amelia Hart</div>
              <div className="badge-row">
                <Badge tone="green">92% person</Badge>
                <Badge tone="amber">86% role</Badge>
              </div>
            </div>
            <button className="button primary" type="button">
              Attach as historical role
            </button>
            <button className="button" type="button">
              Keep separate
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
