import { Badge } from "@/components/badge";

export function ReviewStation() {
  return (
    <section className="panel mock-record" id="Business Cards">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Business Card Review Station</h2>
          <div className="section-kicker">OCR is evidence, not truth. Merges require approval.</div>
        </div>
        <Badge tone="amber">Needs review</Badge>
      </div>
      <div className="panel-body">
        <div className="card-review">
          <div className="card-preview">
            <div>
              <strong>Card image</strong>
              <div className="muted">Original artifact retained</div>
            </div>
          </div>

          <div className="review-section">
            <div className="review-section-header">
              <div>
                <div className="field-label">OCR Parsed Fields</div>
                <div className="muted">Review before creating or merging records.</div>
              </div>
              <Badge tone="amber">86% OCR</Badge>
            </div>

            <dl className="parsed-fields">
              <div>
                <dt>Name</dt>
                <dd>Amelia Hart</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>Deputy Trade Commissioner</dd>
              </div>
              <div>
                <dt>Organization</dt>
                <dd>UK Department for Business and Trade</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>London Office</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>amelia.hart@example.gov.uk</dd>
              </div>
            </dl>
          </div>

          <div className="review-section">
            <div className="review-section-header">
              <div>
                <div className="field-label">Suggested Match</div>
                <div className="review-match-name">Amelia Hart</div>
              </div>
              <div className="badge-row">
                <Badge tone="green">92% person</Badge>
                <Badge tone="amber">86% role</Badge>
              </div>
            </div>
            <p className="review-note">
              Preserve this as a historical government role while keeping the current Northbridge Capital role intact.
            </p>

            <div className="review-actions">
              <button className="button primary" type="button">
                Attach as historical role
              </button>
              <button className="button" type="button">
                Keep separate
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
