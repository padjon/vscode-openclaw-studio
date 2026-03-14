import test from "node:test";
import assert from "node:assert/strict";
import { collectDoctorFindings, parseJsonDocument } from "../core/doctor";

test("doctor flags missing config", () => {
  const summary = collectDoctorFindings({
    workspaceName: "demo",
    workspaceFolderUri: "/tmp/demo",
    configUri: null,
    configDocument: parseJsonDocument(undefined),
    pluginDocuments: [],
    agentsUri: null,
    packageJsonUri: null,
    nodeVersion: "v24.0.0",
    cliBinary: "openclaw",
    cliAvailable: false
  });

  assert.equal(summary.findings.some((finding) => finding.code === "config.missing"), true);
  assert.equal(summary.findings.some((finding) => finding.code === "env.cli.missing"), true);
});

test("doctor accepts minimal healthy config", () => {
  const summary = collectDoctorFindings({
    workspaceName: "demo",
    workspaceFolderUri: "/tmp/demo",
    configUri: "/tmp/demo/openclaw.json",
    configDocument: parseJsonDocument(`{
      "agent": { "model": "anthropic/claude-opus-4-6" },
      "gateway": { "port": 18789, "bind": "loopback" }
    }`),
    pluginDocuments: [],
    agentsUri: "/tmp/demo/AGENTS.md",
    packageJsonUri: "/tmp/demo/package.json",
    nodeVersion: "v24.0.0",
    cliBinary: "openclaw",
    cliAvailable: true
  });

  assert.equal(summary.findings.some((finding) => finding.code === "config.model"), false);
  assert.equal(summary.findings.some((finding) => finding.code === "env.node.ok"), true);
});

test("plugin manifest requires id and config schema", () => {
  const summary = collectDoctorFindings({
    workspaceName: "demo",
    workspaceFolderUri: "/tmp/demo",
    configUri: "/tmp/demo/openclaw.json",
    configDocument: parseJsonDocument(`{
      "agent": { "model": "anthropic/claude-opus-4-6" },
      "gateway": { "port": 18789 }
    }`),
    pluginDocuments: [
      {
        uri: "/tmp/demo/plugins/test/openclaw.plugin.json",
        document: parseJsonDocument(`{}`)
      }
    ],
    agentsUri: "/tmp/demo/AGENTS.md",
    packageJsonUri: "/tmp/demo/package.json",
    nodeVersion: "v24.0.0",
    cliBinary: "openclaw",
    cliAvailable: true
  });

  assert.equal(summary.findings.some((finding) => finding.code === "plugin.id"), true);
  assert.equal(summary.findings.some((finding) => finding.code === "plugin.configSchema"), true);
});
