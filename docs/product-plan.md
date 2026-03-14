# OpenClaw Studio Product Plan

## Product thesis

OpenClaw is already strong at runtime, multi-channel delivery, and onboarding. The missing IDE product is a low-friction workspace companion that helps users configure it correctly, start it quickly, and build plugins with confidence. That is the wedge that can earn broad installs: fewer broken configs, faster first success, and fewer context switches into docs or terminal history.

## Audience

- Developers evaluating OpenClaw for the first time.
- Existing OpenClaw users managing `openclaw.json`, agents, and plugin manifests.
- Plugin authors who need a safe starting point for `openclaw.plugin.json`.
- Team leads and content creators who want a polished tool they can recommend publicly.

## Why this can spread

- It solves setup friction instead of trying to out-chat the chat tools already in the market.
- It works even for users who do not want to grant an IDE extension access to their prompts.
- It surfaces best practices from the official docs directly in the workspace.
- It creates shareable moments: “doctor fixed my config”, “plugin scaffold in one command”, “launch OpenClaw from inside VS Code”.

## Differentiation

- Dashboard-first experience instead of an empty command-only extension.
- Guardrails for OpenClaw-specific config and plugin manifest files.
- Workspace doctor with actionable diagnostics, not generic lint output.
- Sponsor monetization that is visible but tied to delivered value.

## MVP scope

1. Dashboard webview with environment status, setup actions, docs, and sponsor surface.
2. Workspace doctor for `openclaw.json`, `.openclaw/openclaw.json`, and `openclaw.plugin.json`.
3. Config generator for a useful starter `openclaw.json`.
4. Plugin scaffold generator with manifest, package file, TypeScript source, and README.
5. JSON snippets and curated schemas for the most common OpenClaw paths.
6. Terminal launch commands for `openclaw onboard`, `openclaw doctor`, and `openclaw gateway`.

## Install growth strategy

- Optimize the Marketplace listing around “OpenClaw”, “Claude”, “agent”, and “plugin”.
- Keep zero required credentials in the extension itself.
- Publish screenshots and a clear one-minute onboarding story in the README.
- Ask for sponsorship only after value: after doctor success and from the dashboard.
- Ship frequent tagged releases and keep changelog velocity visible.

## Monetization strategy

- Primary: GitHub Sponsors via `FUNDING.yml`, README calls to action, and dashboard placement.
- Secondary: Marketplace credibility that can attract direct sponsorships from tooling companies.
- Positioning: sponsor to fund deeper schema sync, richer plugin tooling, and remote gateway UX.

## Release plan

1. Publish repository with MIT license, funding metadata, and GitHub Actions.
2. Tag `v0.1.0` with packaged VSIX artifact on GitHub Releases.
3. Publish to VS Code Marketplace when `VSCE_PAT` is configured.
4. Follow with schema sync, richer diagnostics, and logs/telemetry opt-in only after adoption.
