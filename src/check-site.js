import tls from "node:tls";
import { performance } from "node:perf_hooks";
import { assessSite } from "./health.js";

export async function checkTlsExpiry(hostname, options = {}) {
  const timeoutMs = options.timeoutMs ?? 8000;
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: true,
    });

    const finish = (error, value) => {
      socket.destroy();
      error ? reject(error) : resolve(value);
    };

    socket.setTimeout(timeoutMs, () => finish(new Error("TLS check timed out")));
    socket.once("error", (error) => finish(error));
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      if (!certificate?.valid_to) return finish(new Error("Certificate expiry was unavailable"));
      const expiresAt = new Date(certificate.valid_to);
      const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
      finish(null, { expiresAt: expiresAt.toISOString(), daysRemaining });
    });
  });
}

export async function checkHttp(site, options = {}) {
  const timeoutMs = options.timeoutMs ?? 8000;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetchImpl(site.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "SiteCare-Monitor/1.0" },
    });
    const responseMs = Math.round(performance.now() - startedAt);
    const contentType = response.headers?.get?.("content-type") ?? "";
    const inspectBody = site.expectContactForm && contentType.includes("text/html");
    const body = inspectBody ? await response.text() : "";

    return {
      name: site.name,
      url: site.url,
      checkedAt: new Date().toISOString(),
      reachable: true,
      statusCode: response.status,
      responseMs,
      finalUrl: response.url || site.url,
      expectContactForm: Boolean(site.expectContactForm),
      contactFormFound: !site.expectContactForm || /<form\b/i.test(body),
      brokenLinks: 0,
    };
  } catch (error) {
    return {
      name: site.name,
      url: site.url,
      checkedAt: new Date().toISOString(),
      reachable: false,
      error: error?.name === "AbortError" ? "Request timed out" : error?.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function monitorSite(site, options = {}) {
  const httpResult = await checkHttp(site, options);
  let tlsDaysRemaining = null;
  let tlsError = null;

  if (httpResult.reachable && new URL(site.url).protocol === "https:") {
    try {
      const tlsChecker = options.tlsChecker ?? checkTlsExpiry;
      const tlsResult = await tlsChecker(new URL(site.url).hostname, options);
      tlsDaysRemaining = tlsResult.daysRemaining;
    } catch (error) {
      tlsError = error?.message ?? "TLS check failed";
    }
  }

  return assessSite({ ...httpResult, tlsDaysRemaining, tlsError }, options);
}
