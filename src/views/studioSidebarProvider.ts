import * as vscode from "vscode";
import type { WorkspaceSummary } from "../core/types";
import { joinUriPath } from "../core/workspace";

export class StudioSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "openclawdStudio.sidebar";

  private view?: vscode.WebviewView;
  private summary: WorkspaceSummary | null = null;

  public constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onMessage: (message: { command: string }) => void
  ) {}

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [joinUriPath(this.extensionUri, "media")]
    };
    view.webview.onDidReceiveMessage((message) => this.onMessage(message));
    view.webview.html = this.render();
  }

  public update(summary: WorkspaceSummary): void {
    this.summary = summary;
    if (this.view) {
      this.view.webview.html = this.render();
    }
  }

  private render(): string {
    const summary = this.summary;
    const counts = {
      error: summary?.findings.filter((finding) => finding.level === "error").length ?? 0,
      warning: summary?.findings.filter((finding) => finding.level === "warning").length ?? 0,
      ok: summary?.findings.filter((finding) => finding.level === "ok").length ?? 0
    };
    const findingsMarkup = summary?.findings
      .slice(0, 8)
      .map(
        (finding) => `
          <li class="finding ${finding.level}">
            <strong>${finding.level.toUpperCase()}</strong>
            <span>${escapeHtml(finding.message)}</span>
          </li>
        `
      )
      .join("") ?? `<li class="finding info"><strong>INFO</strong><span>Run the doctor to inspect your workspace.</span></li>`;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #08131f;
        --panel: rgba(13, 31, 45, 0.95);
        --panel-2: rgba(18, 46, 67, 0.9);
        --text: #f7fbff;
        --muted: #b5c6d6;
        --accent: #ff7a18;
        --accent-2: #ffd166;
        --good: #74c69d;
        --warn: #ffd166;
        --bad: #ff7b72;
        --line: rgba(255, 255, 255, 0.1);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top right, rgba(255, 122, 24, 0.3), transparent 30%),
          radial-gradient(circle at bottom left, rgba(255, 209, 102, 0.18), transparent 28%),
          var(--bg);
        color: var(--text);
      }

      main {
        padding: 16px;
        display: grid;
        gap: 14px;
      }

      .hero {
        background: linear-gradient(135deg, rgba(255, 122, 24, 0.18), rgba(255, 209, 102, 0.08));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        padding: 16px;
      }

      .eyebrow {
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent-2);
      }

      h1 {
        margin: 6px 0 8px;
        font-size: 22px;
      }

      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.45;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .card, .actions, .support, .list {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px;
      }

      .metric {
        display: grid;
        gap: 4px;
        background: var(--panel-2);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px;
      }

      .metric strong {
        font-size: 20px;
      }

      .actions button, .support button {
        width: 100%;
        margin-top: 8px;
        border: 0;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--text);
        text-align: left;
        cursor: pointer;
      }

      .actions button.primary, .support button.primary {
        background: linear-gradient(135deg, var(--accent), #ff9248);
        color: #08131f;
        font-weight: 700;
      }

      .list ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 8px;
      }

      .finding {
        display: grid;
        gap: 4px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .finding strong {
        font-size: 10px;
        letter-spacing: 0.1em;
      }

      .finding.ok { background: rgba(116, 198, 157, 0.08); }
      .finding.warning, .metric.warning { background: rgba(255, 209, 102, 0.08); }
      .finding.error, .metric.error { background: rgba(255, 123, 114, 0.08); }

      .footer-note {
        font-size: 12px;
        color: var(--muted);
      }

      @media (max-width: 520px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="eyebrow">OpenClawd Studio</div>
        <h1>${escapeHtml(summary?.workspaceName ?? "Workspace")} control center</h1>
        <p>Ship OpenClaw faster with guided setup, config guardrails, and plugin scaffolding inside VS Code.</p>
      </section>

      <section class="grid">
        <div class="metric ${counts.error > 0 ? "error" : ""}">
          <span>Errors</span>
          <strong>${counts.error}</strong>
        </div>
        <div class="metric ${counts.warning > 0 ? "warning" : ""}">
          <span>Warnings</span>
          <strong>${counts.warning}</strong>
        </div>
        <div class="metric">
          <span>Healthy checks</span>
          <strong>${counts.ok}</strong>
        </div>
      </section>

      <section class="actions">
        <button class="primary" data-command="runDoctor">Run Workspace Doctor</button>
        <button data-command="scaffoldWorkspaceConfig">Create openclaw.json</button>
        <button data-command="scaffoldPlugin">Scaffold Plugin</button>
        <button data-command="runOnboard">Run openclaw onboard</button>
        <button data-command="runGateway">Launch Gateway</button>
        <button data-command="openDocs">Open Official Docs</button>
      </section>

      <section class="list">
        <h2>Recent findings</h2>
        <ul>${findingsMarkup}</ul>
      </section>

      <section class="support">
        <h2>Support the extension</h2>
        <p class="footer-note">Sponsors fund schema coverage, better plugin authoring, and deeper OpenClaw integration.</p>
        <button class="primary" data-command="sponsor">Sponsor on GitHub</button>
      </section>
    </main>
    <script>
      const vscode = acquireVsCodeApi();
      for (const button of document.querySelectorAll("button[data-command]")) {
        button.addEventListener("click", () => {
          vscode.postMessage({ command: button.dataset.command });
        });
      }
    </script>
  </body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
