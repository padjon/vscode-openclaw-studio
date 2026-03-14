# OpenClaw Studio

[![Install on Marketplace](https://img.shields.io/badge/Marketplace-OpenClaw%20Studio-0078D4?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=padjon.openclaw-studio)
[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/padjon)

OpenClaw Studio is a VS Code extension for people working with OpenClaw. It is built around the practical work developers do every day: creating `openclaw.json`, validating workspace config, scaffolding plugins, and launching the CLI from inside the editor.

This is not another generic AI chat sidebar. The product goal is faster setup, fewer broken configs, and a better plugin-authoring loop.

## What it ships today

- A sidebar dashboard with workspace health, setup actions, docs links, and sponsor support.
- A workspace doctor that inspects `openclaw.json`, `openclaw.plugin.json`, Node version, CLI availability, and common config mistakes.
- A command to scaffold a starter `openclaw.json`.
- A command to scaffold a new OpenClaw plugin in `plugins/<plugin-id>`.
- JSON schemas and snippets for common OpenClaw and plugin manifest paths.
- Terminal launchers for `openclaw onboard` and `openclaw gateway`.

## Why this product exists

The official OpenClaw docs and README make the CLI onboarding path clear, and the plugin manifest docs show strict validation around `openclaw.plugin.json`. That creates an obvious IDE opportunity: help users succeed around the CLI instead of trying to replace it.

Research and product planning live in:

- [docs/research.md](docs/research.md)
- [docs/product-plan.md](docs/product-plan.md)

## Commands

- `OpenClaw Studio: Open Dashboard`
- `OpenClaw Studio: Run Workspace Doctor`
- `OpenClaw Studio: Create openclaw.json`
- `OpenClaw Studio: Scaffold Plugin`
- `OpenClaw Studio: Run openclaw onboard`
- `OpenClaw Studio: Run Gateway`
- `OpenClaw Studio: Open Docs`

## Local development

```bash
npm install
npm run test:build
npm run package:vsix
```

## Release flow

- CI builds, tests, and packages the extension on pushes and pull requests.
- Tagging `v*` triggers a GitHub Release with the packaged VSIX artifact.
- Marketplace publish is wired into GitHub Actions and runs when `VSCE_PAT` is configured.

## Sponsorship

The monetization strategy is sponsorship-led, not paywalled. If the extension saves time, support continued development via:

- GitHub Sponsors: https://github.com/sponsors/padjon
- VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=padjon.openclaw-studio

## Feedback

If you hit issues or have wishes for new features, tell us:

- GitHub issues: https://github.com/padjon/vscode-openclaw-studio/issues
- Email: info@devsheep.de

## Notes

- This project is an independent community tool and is not an official OpenClaw extension.
- The current schema coverage is intentionally focused on the most common configuration paths. Broader schema sync is a planned next step.
