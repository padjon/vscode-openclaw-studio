import * as vscode from "vscode";
import * as path from "node:path";
import { parseJsonDocument } from "./doctor";
import type { ParsedJsonDocument } from "./types";

export function getPrimaryWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}

export async function readTextDocument(uri: vscode.Uri): Promise<string | undefined> {
  try {
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
  } catch {
    return undefined;
  }
}

export async function readParsedJson(uri: vscode.Uri | null): Promise<ParsedJsonDocument> {
  if (!uri) {
    return parseJsonDocument(undefined);
  }
  const content = await readTextDocument(uri);
  return parseJsonDocument(content);
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

export async function resolveWorkspaceFiles(folder: vscode.WorkspaceFolder | undefined) {
  if (!folder) {
    return {
      configUri: null,
      packageJsonUri: null,
      agentsUri: null,
      pluginManifestUris: [] as vscode.Uri[]
    };
  }

  const rootConfig = joinUriPath(folder.uri, "openclaw.json");
  const nestedConfig = joinUriPath(folder.uri, ".openclaw", "openclaw.json");
  const packageJson = joinUriPath(folder.uri, "package.json");
  const agents = joinUriPath(folder.uri, "AGENTS.md");

  const [hasRootConfig, hasNestedConfig, hasPackageJson, hasAgents, pluginManifestUris] =
    await Promise.all([
      fileExists(rootConfig),
      fileExists(nestedConfig),
      fileExists(packageJson),
      fileExists(agents),
      vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, "**/openclaw.plugin.json"),
        "**/{node_modules,dist,.git}/**",
        50
      )
    ]);

  return {
    configUri: hasRootConfig ? rootConfig : hasNestedConfig ? nestedConfig : null,
    packageJsonUri: hasPackageJson ? packageJson : null,
    agentsUri: hasAgents ? agents : null,
    pluginManifestUris
  };
}

export async function writeFile(uri: vscode.Uri, content: string): Promise<void> {
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
}

export function joinUriPath(base: vscode.Uri, ...segments: string[]): vscode.Uri {
  return base.with({
    path: path.posix.join(base.path, ...segments)
  });
}
