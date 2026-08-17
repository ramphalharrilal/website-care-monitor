const elements = {
  heroScore: document.querySelector("#hero-score"),
  heroSites: document.querySelector("#hero-sites"),
  heroAction: document.querySelector("#hero-action"),
  updatedAt: document.querySelector("#updated-at"),
  total: document.querySelector("#metric-total"),
  healthy: document.querySelector("#metric-healthy"),
  action: document.querySelector("#metric-action"),
  resolved: document.querySelector("#metric-resolved"),
  siteList: document.querySelector("#site-list"),
  actionList: document.querySelector("#action-list"),
  quietState: document.querySelector("#quiet-state"),
  timeline: document.querySelector("#timeline"),
};

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function renderSite(site) {
  const row = make("article", "site-row");

  const identity = make("div", "site-name");
  identity.append(make("span", "site-avatar", initials(site.name)));
  const identityText = make("div");
  identityText.append(make("strong", "", site.name), make("small", "", site.category));
  identity.append(identityText);

  row.append(identity, make("div", "site-summary", site.summary));

  const response = make("div", "site-cell response");
  response.append(make("strong", "", `${site.responseMs.toLocaleString()} ms`), make("small", "", "Response"));
  row.append(response);

  const certificate = make("div", "site-cell certificate");
  certificate.append(make("strong", "", `${site.tlsDaysRemaining} days`), make("small", "", "Certificate"));
  row.append(certificate);

  const state = make("span", `site-state ${site.status}`);
  state.append(make("span", "site-status-dot"), document.createTextNode(site.status));
  row.append(state);
  return row;
}

function renderAction(site, issue) {
  const item = make("li", "action-item");
  const content = make("div");
  content.append(make("strong", "", site.name), make("p", "", issue));
  const impact = site.status === "critical" ? "Customer inquiries at risk" : "Trust warning approaching";
  content.append(make("small", "", impact));
  item.append(content);
  return item;
}

function renderActivity(activity) {
  const item = make("article", "timeline-item");
  item.append(make("time", "", activity.time), make("strong", "", activity.title), make("p", "", activity.description));
  return item;
}

function render(data) {
  const healthy = data.sites.filter((site) => site.status === "healthy").length;
  const action = data.sites.length - healthy;
  const averageScore = Math.round(data.sites.reduce((sum, site) => sum + site.score, 0) / data.sites.length);

  elements.heroScore.textContent = averageScore;
  elements.heroSites.textContent = data.sites.length;
  elements.heroAction.textContent = action;
  elements.total.textContent = data.sites.length;
  elements.healthy.textContent = healthy;
  elements.action.textContent = action;
  elements.resolved.textContent = data.resolvedThisMonth;
  elements.updatedAt.textContent = `Sample report · ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}`;

  elements.siteList.replaceChildren(...data.sites.map(renderSite));

  const actions = data.sites.flatMap((site) => site.issues.map((issue) => renderAction(site, issue)));
  elements.actionList.replaceChildren(...actions);
  elements.quietState.hidden = actions.length > 0;
  elements.timeline.replaceChildren(...data.activity.map(renderActivity));
}

async function loadDashboard() {
  try {
    const response = await fetch("./demo-data.json");
    if (!response.ok) throw new Error(`Report request returned ${response.status}`);
    render(await response.json());
  } catch {
    elements.updatedAt.textContent = "Sample report unavailable";
    elements.siteList.replaceChildren(make("div", "error-card", "The sample dashboard could not be loaded. Refresh the page or run the local server."));
  }
}

loadDashboard();
