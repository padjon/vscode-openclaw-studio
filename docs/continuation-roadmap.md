# OpenClaw Studio Continuation Roadmap

## Purpose

This document is the handoff point for future implementation work. It describes the product vision, the current state of the extension, what is still missing, and the highest-leverage next steps to turn the current MVP into a full OpenClaw IDE experience.

## Product vision

OpenClaw Studio should become the default editor experience for anyone configuring, operating, or extending OpenClaw.

The long-term product is not a generic AI sidebar. It is an operational workspace companion with four pillars:

1. Configuration confidence.
   Users should be able to open any OpenClaw workspace and immediately see whether it is healthy, risky, or incomplete.
2. Fast onboarding.
   New users should be able to go from empty folder to working `openclaw.json` and a running gateway with minimal terminal guesswork.
3. Plugin authoring.
   Plugin developers should get scaffolds, schema help, diagnostics, and packaging workflows that feel first-class.
4. Runtime control.
   The extension should eventually show real gateway state, logs, connected services, and actionable fixes instead of only static workspace checks.

## Current state

The current extension is a solid MVP and already good enough to remain public:

- Sidebar dashboard exists and provides primary actions.
- Workspace doctor exists for `openclaw.json` and `openclaw.plugin.json`.
- Config scaffolding exists.
- Plugin scaffolding exists.
- JSON snippets and lightweight schemas exist.
- CLI launcher commands exist.
- GitHub release and Marketplace publish flow exist.

What it is today:

- A useful companion extension.
- A credible Marketplace listing.
- A product with real workflow value.

What it is not yet:

- A deep runtime integration.
- A full schema-synced editor experience.
- A mature plugin development environment.
- A polished 1.0-grade VS Code product.

## What remains

### 1. Schema and validation depth

Current validation is intentionally heuristic and covers common paths only.

Remaining work:

- Sync validation rules more closely with upstream OpenClaw config semantics.
- Expand `openclaw.json` schema coverage across channels, plugins, gateway, agents, and security settings.
- Add more plugin manifest validation and better field-specific messaging.
- Support warnings for deprecated keys and migration hints.

Outcome:

- The doctor becomes trustworthy enough for advanced users, not only beginners.

### 2. Quick fixes and editor intelligence

Diagnostics exist, but they do not yet close the loop.

Remaining work:

- Add code actions to create missing sections or fix common mistakes.
- Add completions for common config keys and plugin fields.
- Add hover docs that explain settings in-place.
- Add more snippets for common channel/provider setups.

Outcome:

- The extension feels like an IDE feature set, not just a dashboard with commands.

### 3. Runtime and gateway integration

The extension launches CLI commands today but does not observe the real OpenClaw runtime.

Remaining work:

- Detect whether the gateway is reachable.
- Show live status for the gateway and common services.
- Surface logs or recent errors inside VS Code.
- Add actions for common operational flows like doctor, restart, health check, and log open.

Outcome:

- The product moves from static configuration help into active operations.

### 4. Plugin developer workflow

The plugin generator is useful, but still basic.

Remaining work:

- Add richer plugin templates by plugin kind.
- Add manifest-aware completions and validation helpers.
- Add commands for plugin build/package/test workflows.
- Add sample test scaffolds and recommended file layouts.

Outcome:

- Plugin authors can stay inside VS Code from scaffold to first working build.

### 5. UX polish

The UX is functional but not yet at the level of a category-defining extension.

Remaining work:

- Improve empty states and first-run guidance.
- Add more intentional dashboard hierarchy and richer health summaries.
- Add screenshots and better visual storytelling to the Marketplace page.
- Refine wording, iconography, and onboarding prompts.

Outcome:

- Better first impression, better install-to-retention conversion.

### 6. Quality and test coverage

Current automated testing is narrow and mostly doctor-focused.

Remaining work:

- Add tests for scaffolding logic.
- Add tests for diagnostics mapping and settings handling.
- Add extension-level smoke tests where practical.
- Add regression tests for roadmap-critical features as they land.

Outcome:

- Safer iteration and less friction when expanding the feature set.

## Recommended implementation order

If work resumes later, the highest-value sequence is:

1. Deepen schema coverage and diagnostics.
2. Add quick fixes for the most common doctor findings.
3. Add real gateway/runtime status integration.
4. Expand plugin authoring workflows.
5. Polish onboarding and dashboard UX.
6. Increase automated test coverage in parallel with each feature area.

## Suggested milestone framing

### 0.9.x

Goal:

- Strong public beta with clear core value and continuation plan.

Expected qualities:

- Stable packaging and publishing.
- Good enough onboarding and doctoring for public use.
- Clear roadmap toward a richer IDE experience.

### 1.0.0

Goal:

- A full OpenClaw workspace companion that feels essential for both new users and plugin authors.

Expected qualities:

- Broad config awareness.
- Actionable quick fixes.
- Real runtime visibility.
- Mature plugin scaffolding and authoring support.
- Better test depth and stronger product polish.

## Guardrails for future work

- Do not turn this into a generic chat UI unless that directly improves OpenClaw workflows.
- Keep sponsorship visible but tied to delivered value.
- Favor official OpenClaw docs and real runtime behavior over guessed semantics.
- Preserve the practical product wedge: setup, safety, scaffolding, and operations.
