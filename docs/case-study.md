# Case study: catching website problems before customers do

## Situation

A small service business depends on its website for trust and new inquiries. The site may technically be “online” while still failing the customer: it can respond slowly, show a certificate warning, or lose the contact form that turns a visit into a lead.

Most lightweight uptime tools answer only whether a server responded. Many full monitoring platforms answer with dashboards designed for technical teams. SiteCare fills the gap with a compact operational view for the person responsible for the business outcome.

## The job to be done

Give an owner or support specialist three answers in under a minute:

1. Can customers reach every important website?
2. Is anything likely to reduce trust or block an inquiry?
3. What should be fixed first?

## Solution

The monitor collects a small set of high-value signals:

- availability and page status;
- response time;
- security-certificate expiry;
- presence of an expected contact form.

The scoring engine converts those signals into healthy, attention, or critical states. Each deduction creates a plain-language issue, and the dashboard turns those issues into a priority queue.

## Decisions and tradeoffs

### Business language before infrastructure language

The interface leads with “customers cannot reach the website” instead of connection errors. Technical details such as response milliseconds remain visible for diagnosis, but they are supporting evidence rather than the headline.

### Small, explainable scoring model

The score is deterministic and tested. An outage is immediately critical. Server errors, an expired certificate, slow response, and a missing expected form apply documented deductions. This is easier to audit than a black-box health score.

### Safe demonstration boundary

The public GitHub Pages experience uses fictional company names and sample data. The live checker performs read-only requests and never submits a form. This makes the solution demonstrable without exposing client information or sending traffic to a real customer property.

### No dependency overhead

The initial release uses Node.js platform APIs. That keeps installation, patching, and supply-chain exposure small while the product is still focused on core monitoring behavior.

## Verification

Automated tests verify:

- healthy, attention, and critical classification;
- unreachable and timeout results;
- contact-form detection;
- TLS-result integration;
- server health response and security headers.

Repository validation also checks that required documentation and public assets exist and rejects common secret-like placeholders.

## Outcome

SiteCare demonstrates a complete support workflow rather than a code sample: collect evidence, translate it into customer impact, prioritize the response, and document the operating boundary. It gives a potential client or employer a working solution they can understand before reading any implementation detail.

## Next iteration

The strongest next step is scheduled collection with history. That will allow the dashboard to show repeat incidents, monthly availability, and whether a fix actually improved the customer experience. A same-domain link crawler and isolated form journey testing can then expand coverage without weakening the safety model.
