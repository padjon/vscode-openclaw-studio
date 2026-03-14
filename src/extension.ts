import * as cp from "node:child_process";
import * as path from "node:path";
import * as vscode from "vscode";
import { collectDoctorFindings, resolveJsonPathRange } from "./core/doctor";
import { createPluginFiles, createWorkspaceConfigTemplate } from "./core/templates";
import { getPrimaryWorkspaceFolder, joinUriPath, readParsedJson, resolveWorkspaceFiles, writeFile } from "./core/workspace";
import type { DoctorFinding, WorkspaceSummary } from "./core/types";
import { StudioSidebarProvider } from "./views/studioSidebarProvider";

const sponsorUrl = "https://github.com/sponsors/padjon";
const docsUrl = "https://docs.openclaw.ai";
const sponsorStateKey = "openclawStudio.sponsorDismissed";

let diagnostics: vscode.DiagnosticCollection;
let statusBar: vscode.StatusBarItem;
let sidebarProvider: StudioSidebarProvider;
let latestSummary: WorkspaceSummary | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  diagnostics = vscode.languages.createDiagnosticCollection("openclawStudio");
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBar.command = "openclawStudio.openDashboard";
  statusBar.show();

  sidebarProvider = new StudioSidebarProvider(context.extensionUri, (message) => {
    void handleSidebarMessage(context, message.command);
  });

  context.subscriptions.push(
    diagnostics,
    statusBar,
    vscode.window.registerWebviewViewProvider(StudioSidebarProvider.viewType, sidebarProvider),
    vscode.commands.registerCommand("openclawStudio.openDashboard", async () => {
      await vscode.commands.executeCommand("workbench.view.extension.openclawStudio");
    }),
    vscode.commands.registerCommand("openclawStudio.runDoctor", async () => {
      await refreshWorkspaceSummary(context, true);
    }),
    vscode.commands.registerCommand("openclawStudio.scaffoldWorkspaceConfig", scaffoldWorkspaceConfig),
    vscode.commands.registerCommand("openclawStudio.scaffoldPlugin", scaffoldPlugin),
    vscode.commands.registerCommand("openclawStudio.runOnboard", () => runTerminalCommand(`${getCliBinary()} onboard --install-daemon`)),
    vscode.commands.registerCommand("openclawStudio.runGateway", () => runTerminalCommand(`${getCliBinary()} gateway --port 18789 --verbose`)),
    vscode.commands.registerCommand("openclawStudio.openDocs", () => {
      void vscode.env.openExternal(vscode.Uri.parse(docsUrl));
    }),
    vscode.workspace.onDidSaveTextDocument(() => {
      void maybeRefreshDoctor(context);
    }),
    vscode.workspace.onDidCreateFiles(() => {
      void maybeRefreshDoctor(context);
    }),
    vscode.workspace.onDidDeleteFiles(() => {
      void maybeRefreshDoctor(context);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void maybeRefreshDoctor(context);
    })
  );

  await refreshWorkspaceSummary(context, false);
}

export function deactivate(): void {
  diagnostics?.dispose();
  statusBar?.dispose();
}

async function handleSidebarMessage(context: vscode.ExtensionContext, command: string): Promise<void> {
  switch (command) {
    case "runDoctor":
      await vscode.commands.executeCommand("openclawStudio.runDoctor");
      break;
    case "scaffoldWorkspaceConfig":
      await vscode.commands.executeCommand("openclawStudio.scaffoldWorkspaceConfig");
      break;
    case "scaffoldPlugin":
      await vscode.commands.executeCommand("openclawStudio.scaffoldPlugin");
      break;
    case "runOnboard":
      await vscode.commands.executeCommand("openclawStudio.runOnboard");
      break;
    case "runGateway":
      await vscode.commands.executeCommand("openclawStudio.runGateway");
      break;
    case "openDocs":
      await vscode.commands.executeCommand("openclawStudio.openDocs");
      break;
    case "sponsor":
      await vscode.env.openExternal(vscode.Uri.parse(sponsorUrl));
      await context.globalState.update(sponsorStateKey, false);
      break;
    default:
      break;
  }
}

async function maybeRefreshDoctor(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("openclawStudio");
  if (!config.get<boolean>("autoRunDoctor", true)) {
    return;
  }
  await refreshWorkspaceSummary(context, false);
}

async function refreshWorkspaceSummary(context: vscode.ExtensionContext, forceMessage: boolean): Promise<void> {
  const folder = getPrimaryWorkspaceFolder();
  if (!folder) {
    const summary: WorkspaceSummary = {
      workspaceName: "No Workspace",
      workspaceFolderUri: null,
      files: {
        configUri: null,
        pluginManifestUris: [],
        packageJsonUri: null,
        agentsUri: null
      },
      nodeVersion: process.version,
      cliBinary: getCliBinary(),
      cliAvailable: false,
      findings: [
        {
          code: "workspace.none",
          level: "info",
          message: "Open a folder to use OpenClaw Studio."
        }
      ]
    };
    applySummary(summary);
    return;
  }

  const files = await resolveWorkspaceFiles(folder);
  const configDocument = await readParsedJson(files.configUri);
  const pluginDocuments = await Promise.all(
    files.pluginManifestUris.map(async (uri) => ({
      uri: uri.toString(),
      document: await readParsedJson(uri)
    }))
  );

  const summary = collectDoctorFindings({
    workspaceName: folder.name,
    workspaceFolderUri: folder.uri.toString(),
    configUri: files.configUri?.toString() ?? null,
    configDocument,
    pluginDocuments,
    agentsUri: files.agentsUri?.toString() ?? null,
    packageJsonUri: files.packageJsonUri?.toString() ?? null,
    nodeVersion: process.version,
    cliBinary: getCliBinary(),
    cliAvailable: isCliAvailable(getCliBinary())
  });

  latestSummary = summary;
  applySummary(summary);
  await publishDiagnostics(folder, summary, configDocument, pluginDocuments);

  if (forceMessage) {
    const errorCount = summary.findings.filter((finding) => finding.level === "error").length;
    const warningCount = summary.findings.filter((finding) => finding.level === "warning").length;
    const label = errorCount > 0 ? `${errorCount} error(s)` : warningCount > 0 ? `${warningCount} warning(s)` : "healthy";
    void vscode.window.showInformationMessage(`OpenClaw Studio doctor finished: ${label}.`);
  }

  await maybeShowSponsorNudge(context, summary);
}

function applySummary(summary: WorkspaceSummary): void {
  latestSummary = summary;
  sidebarProvider.update(summary);

  const errorCount = summary.findings.filter((finding) => finding.level === "error").length;
  const warningCount = summary.findings.filter((finding) => finding.level === "warning").length;
  if (errorCount > 0) {
    statusBar.text = `$(warning) OpenClaw ${errorCount} error${errorCount === 1 ? "" : "s"}`;
    statusBar.tooltip = "OpenClaw Studio found blocking issues in this workspace.";
  } else if (warningCount > 0) {
    statusBar.text = `$(info) OpenClaw ${warningCount} warning${warningCount === 1 ? "" : "s"}`;
    statusBar.tooltip = "OpenClaw Studio found recommended fixes for this workspace.";
  } else {
    statusBar.text = "$(check) OpenClaw ready";
    statusBar.tooltip = "OpenClaw Studio workspace looks healthy.";
  }
}

async function publishDiagnostics(
  folder: vscode.WorkspaceFolder,
  summary: WorkspaceSummary,
  configDocument: { rawText?: string },
  pluginDocuments: ReadonlyArray<{ uri: string; document: { rawText?: string } }>
): Promise<void> {
  diagnostics.clear();

  const configUri = summary.files.configUri ? vscode.Uri.parse(summary.files.configUri) : null;
  if (configUri && configDocument.rawText) {
    diagnostics.set(configUri, findingsToDiagnostics(configDocument.rawText, summary.findings.filter((finding) => !finding.code.startsWith("plugin."))));
  }

  for (const plugin of pluginDocuments) {
    const uri = vscode.Uri.parse(plugin.uri);
    const pluginFindings = summary.findings.filter(
      (finding) => finding.code.startsWith("plugin.") && finding.uri === plugin.uri
    );
    diagnostics.set(uri, findingsToDiagnostics(plugin.document.rawText ?? "", pluginFindings));
  }

  if (!configUri && summary.findings.some((finding) => finding.code === "config.missing")) {
    const infoMessage = "No `openclaw.json` found. Use `OpenClaw Studio: Create openclaw.json` to scaffold one.";
    void vscode.window.setStatusBarMessage(infoMessage, 5000);
  }

  void folder;
}

function findingsToDiagnostics(documentText: string, findings: readonly DoctorFinding[]): vscode.Diagnostic[] {
  return findings
    .filter((finding) => finding.level === "error" || finding.level === "warning" || finding.level === "info")
    .map((finding) => {
      const range = finding.path ? resolveJsonPathRange(documentText, finding.path) : null;
      const diagnostic = new vscode.Diagnostic(
        range
          ? new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character)
          : new vscode.Range(0, 0, 0, 1),
        finding.message,
        finding.level === "error"
          ? vscode.DiagnosticSeverity.Error
          : finding.level === "warning"
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Information
      );
      diagnostic.code = finding.code;
      return diagnostic;
    });
}

async function scaffoldWorkspaceConfig(): Promise<void> {
  const folder = getPrimaryWorkspaceFolder();
  if (!folder) {
    void vscode.window.showErrorMessage("Open a workspace folder before creating openclaw.json.");
    return;
  }

  const target = joinUriPath(folder.uri, "openclaw.json");
  try {
    await vscode.workspace.fs.stat(target);
    const document = await vscode.workspace.openTextDocument(target);
    await vscode.window.showTextDocument(document);
    return;
  } catch {
    // continue
  }

  await writeFile(target, createWorkspaceConfigTemplate());
  const document = await vscode.workspace.openTextDocument(target);
  await vscode.window.showTextDocument(document);
}

async function scaffoldPlugin(): Promise<void> {
  const folder = getPrimaryWorkspaceFolder();
  if (!folder) {
    void vscode.window.showErrorMessage("Open a workspace folder before scaffolding a plugin.");
    return;
  }

  const pluginId = (await vscode.window.showInputBox({
    prompt: "Plugin id",
    placeHolder: "my-openclaw-plugin",
    value: "my-openclaw-plugin",
    validateInput: (value) => (/^[a-z0-9-_]+$/.test(value) ? undefined : "Use lowercase letters, numbers, dashes, or underscores.")
  }))?.trim();

  if (!pluginId) {
    return;
  }

  const pluginsRoot = joinUriPath(folder.uri, "plugins");
  await vscode.workspace.fs.createDirectory(pluginsRoot);
  const files = createPluginFiles(pluginId);

  for (const file of files) {
    const target = joinUriPath(pluginsRoot, ...file.path.split("/"));
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(target.fsPath)));
    await writeFile(target, file.content);
  }

  const manifest = joinUriPath(pluginsRoot, pluginId, "openclaw.plugin.json");
  const document = await vscode.workspace.openTextDocument(manifest);
  await vscode.window.showTextDocument(document);
}

function runTerminalCommand(command: string): void {
  const terminal = vscode.window.terminals.find((entry) => entry.name === "OpenClaw Studio")
    ?? vscode.window.createTerminal({ name: "OpenClaw Studio" });
  terminal.show(true);
  terminal.sendText(command, true);
}

function getCliBinary(): string {
  return vscode.workspace.getConfiguration("openclawStudio").get<string>("cliBinary", "openclaw");
}

function isCliAvailable(binary: string): boolean {
  try {
    const result = cp.spawnSync(binary, ["--version"], {
      encoding: "utf8",
      timeout: 3000,
      shell: process.platform === "win32"
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

async function maybeShowSponsorNudge(context: vscode.ExtensionContext, summary: WorkspaceSummary): Promise<void> {
  const dismissed = context.globalState.get<boolean>(sponsorStateKey, false);
  if (dismissed) {
    return;
  }

  const errorCount = summary.findings.filter((finding) => finding.level === "error").length;
  if (errorCount > 0) {
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    "OpenClaw Studio is helping keep this workspace healthy. Sponsor continued development?",
    "Sponsor",
    "Dismiss"
  );

  if (choice === "Sponsor") {
    await vscode.env.openExternal(vscode.Uri.parse(sponsorUrl));
  }

  if (choice === "Dismiss") {
    await context.globalState.update(sponsorStateKey, true);
  }
}
