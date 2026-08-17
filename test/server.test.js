import assert from "node:assert/strict";
import test from "node:test";
import { createSiteCareServer } from "../src/server.js";

test("demo server exposes a health endpoint and security headers", async (context) => {
  const server = createSiteCareServer().listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.status, "ok");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("demo server serves the dashboard for browsers and health checks", async (context) => {
  const server = createSiteCareServer().listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const pageResponse = await fetch(`http://127.0.0.1:${port}/`);
  const page = await pageResponse.text();
  const headResponse = await fetch(`http://127.0.0.1:${port}/`, { method: "HEAD" });

  assert.equal(pageResponse.status, 200);
  assert.match(pageResponse.headers.get("content-type"), /text\/html/);
  assert.match(page, /Know when your website is/);
  assert.equal(headResponse.status, 200);
});

test("demo server rejects malformed paths without crashing", async (context) => {
  const server = createSiteCareServer().listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/%E0%A4%A`);
  assert.equal(response.status, 400);
});
