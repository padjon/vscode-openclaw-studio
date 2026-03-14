import {
  findNodeAtLocation,
  parse,
  parseTree,
  printParseErrorCode,
  type Node as JsonNode,
  type ParseError
} from "jsonc-parser";
import type { ParsedJsonDocument, DoctorFinding, WorkspaceSummary } from "./types";

export interface DoctorInputs {
  readonly workspaceName: string;
  readonly workspaceFolderUri: string | null;
  readonly configUri: string | null;
  readonly configDocument: ParsedJsonDocument;
  readonly pluginDocuments: ReadonlyArray<{
    readonly uri: string;
    readonly document: ParsedJsonDocument;
  }>;
  readonly agentsUri: string | null;
  readonly packageJsonUri: string | null;
  readonly nodeVersion: string;
  readonly cliBinary: string;
  readonly cliAvailable: boolean;
}

const minimumNodeMajor = 22;

export function parseJsonDocument(rawText: string | undefined): ParsedJsonDocument {
  if (rawText === undefined) {
    return {
      exists: false,
      isValid: false,
      parseErrors: []
    };
  }

  const parseErrors: ParseError[] = [];
  const value = parse(rawText, parseErrors, { allowTrailingComma: true, disallowComments: false });

  return {
    exists: true,
    isValid: parseErrors.length === 0,
    rawText,
    value,
    parseErrors: parseErrors.map((entry) => ({
      error: printParseErrorCode(entry.error),
      offset: entry.offset,
      length: entry.length
    }))
  };
}

function majorVersion(version: string): number | null {
  const match = version.match(/(\d+)/);
  if (!match) {
    return null;
  }
  const matchedVersion = match[1];
  return matchedVersion ? Number.parseInt(matchedVersion, 10) : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateConfigShape(value: unknown): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  if (!isObject(value)) {
    findings.push({
      code: "config.type",
      level: "error",
      message: "openclaw.json must contain a JSON object."
    });
    return findings;
  }

  const agent = value.agent;
  if (!isObject(agent) || typeof agent.model !== "string" || !agent.model.trim()) {
    findings.push({
      code: "config.model",
      level: "warning",
      message: "Set `agent.model` so OpenClaw starts with a clear default model.",
      path: "agent.model"
    });
  }

  const gateway = value.gateway;
  if (!isObject(gateway)) {
    findings.push({
      code: "config.gateway",
      level: "warning",
      message: "Add a `gateway` section so the local control plane settings are explicit.",
      path: "gateway"
    });
  } else {
    if (gateway.port !== undefined && typeof gateway.port !== "number") {
      findings.push({
        code: "config.gateway.port",
        level: "error",
        message: "`gateway.port` must be a number.",
        path: "gateway.port"
      });
    }

    if (gateway.bind !== undefined && !["loopback", "custom", "all"].includes(String(gateway.bind))) {
      findings.push({
        code: "config.gateway.bind",
        level: "warning",
        message: "`gateway.bind` should usually be `loopback`, `custom`, or `all`.",
        path: "gateway.bind"
      });
    }
  }

  const browser = value.browser;
  if (isObject(browser) && browser.enabled === true && typeof browser.color !== "string") {
    findings.push({
      code: "config.browser.color",
      level: "info",
      message: "Set `browser.color` to make the managed browser profile visually distinct.",
      path: "browser.color"
    });
  }

  const plugins = value.plugins;
  if (plugins !== undefined) {
    if (!isObject(plugins)) {
      findings.push({
        code: "config.plugins.type",
        level: "error",
        message: "`plugins` must be an object.",
        path: "plugins"
      });
    } else if (plugins.entries !== undefined && !isObject(plugins.entries)) {
      findings.push({
        code: "config.plugins.entries",
        level: "error",
        message: "`plugins.entries` must be an object keyed by plugin id.",
        path: "plugins.entries"
      });
    }
  }

  return findings;
}

function validatePluginManifest(value: unknown, uri: string): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  if (!isObject(value)) {
    findings.push({
      code: "plugin.type",
      level: "error",
      message: "openclaw.plugin.json must contain a JSON object.",
      uri
    });
    return findings;
  }

  if (typeof value.id !== "string" || !value.id.trim()) {
    findings.push({
      code: "plugin.id",
      level: "error",
      message: "Plugin manifest requires a non-empty `id`.",
      path: "id",
      uri
    });
  }

  if (!isObject(value.configSchema)) {
    findings.push({
      code: "plugin.configSchema",
      level: "error",
      message: "Plugin manifest requires an inline `configSchema` object.",
      path: "configSchema",
      uri
    });
  }

  return findings;
}

function createNodeVersionFinding(nodeVersion: string): DoctorFinding {
  const major = majorVersion(nodeVersion);
  if (major !== null && major >= minimumNodeMajor) {
    return {
      code: "env.node.ok",
      level: "ok",
      message: `Node ${nodeVersion} satisfies the OpenClaw runtime recommendation.`
    };
  }

  return {
    code: "env.node.version",
    level: "warning",
    message: `Node ${nodeVersion} is below the recommended runtime (${minimumNodeMajor}+).`
  };
}

export function collectDoctorFindings(inputs: DoctorInputs): WorkspaceSummary {
  const findings: DoctorFinding[] = [];

  findings.push(createNodeVersionFinding(inputs.nodeVersion));

  if (!inputs.cliAvailable) {
    findings.push({
      code: "env.cli.missing",
      level: "warning",
      message: `The \`${inputs.cliBinary}\` CLI is not available in PATH.`,
      detail: "Run the onboarding command after installing OpenClaw globally."
    });
  } else {
    findings.push({
      code: "env.cli.ok",
      level: "ok",
      message: `The \`${inputs.cliBinary}\` CLI is available.`
    });
  }

  if (!inputs.configUri) {
    findings.push({
      code: "config.missing",
      level: "warning",
      message: "No `openclaw.json` file was found in the workspace root."
    });
  } else if (!inputs.configDocument.exists) {
    findings.push({
      code: "config.unreadable",
      level: "error",
      message: "Configured workspace file path exists logically but could not be read."
    });
  } else if (!inputs.configDocument.isValid) {
    for (const error of inputs.configDocument.parseErrors) {
      findings.push({
        code: "config.parse",
        level: "error",
        message: `Invalid JSONC in openclaw.json: ${error.error}.`
      });
    }
  } else {
    findings.push(...validateConfigShape(inputs.configDocument.value));
    if (findings.every((finding) => finding.code !== "config.parse")) {
      findings.push({
        code: "config.present",
        level: "ok",
        message: "Workspace config is present and parseable."
      });
    }
  }

  if (!inputs.agentsUri) {
    findings.push({
      code: "workspace.agents",
      level: "info",
      message: "No `AGENTS.md` was found at the workspace root.",
      detail: "Add one if you want a codified assistant playbook inside the project."
    });
  }

  if (!inputs.packageJsonUri) {
    findings.push({
      code: "workspace.packagejson",
      level: "info",
      message: "No `package.json` found at the workspace root.",
      detail: "That is fine for config-only repos, but plugin projects usually include one."
    });
  }

  if (inputs.pluginDocuments.length === 0) {
    findings.push({
      code: "plugin.none",
      level: "info",
      message: "No plugin manifests found. Use the scaffold command to create one."
    });
  }

  for (const plugin of inputs.pluginDocuments) {
    if (!plugin.document.isValid) {
      findings.push({
        code: "plugin.parse",
        level: "error",
        message: `Invalid JSONC in ${plugin.uri.split("/").pop() ?? "plugin manifest"}.`,
        uri: plugin.uri
      });
      continue;
    }

    findings.push(...validatePluginManifest(plugin.document.value, plugin.uri));
  }

  return {
    workspaceName: inputs.workspaceName,
    workspaceFolderUri: inputs.workspaceFolderUri,
    files: {
      configUri: inputs.configUri,
      pluginManifestUris: inputs.pluginDocuments.map((entry) => entry.uri),
      packageJsonUri: inputs.packageJsonUri,
      agentsUri: inputs.agentsUri
    },
    nodeVersion: inputs.nodeVersion,
    cliBinary: inputs.cliBinary,
    cliAvailable: inputs.cliAvailable,
    findings
  };
}

function dottedPathToSegments(path: string): Array<string | number> {
  return path.split(".").filter(Boolean).map((segment) => {
    const numeric = Number(segment);
    return Number.isInteger(numeric) && String(numeric) === segment ? numeric : segment;
  });
}

function fallbackPosition(documentText: string, offset?: number) {
  const clampedOffset = Math.max(0, Math.min(documentText.length, offset ?? 0));
  const prefix = documentText.slice(0, clampedOffset);
  const lines = prefix.split(/\r?\n/);
  return {
    line: Math.max(0, lines.length - 1),
    character: lines.at(-1)?.length ?? 0
  };
}

export function resolveJsonPathRange(documentText: string, path: string): {
  start: { line: number; character: number };
  end: { line: number; character: number };
} | null {
  const tree = parseTree(documentText);
  if (!tree) {
    return null;
  }

  const node = findNodeAtLocation(tree, dottedPathToSegments(path)) ?? tree;
  return nodeToRange(documentText, node);
}

function nodeToRange(documentText: string, node: JsonNode) {
  const start = fallbackPosition(documentText, node.offset);
  const end = fallbackPosition(documentText, node.offset + node.length);
  return { start, end };
}
