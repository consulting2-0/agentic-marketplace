[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

# Consulting 2.0 — Agentic Marketplace

**The open-source agentic marketplace for enterprise intelligence.**
Browse and install AI agents, skills, commands, hooks, and MCP integrations built for SAP BTP, Integration Suite, CAP, ABAP Cloud, and AI Foundation.

## 🌐 Live

**[consulting20.com](https://consulting20.com)** — Browse and install components via the interactive marketplace.

## What's Inside

| Component | Description | Examples |
|-----------|-------------|----------|
| **🤖 Agents** | AI specialists for specific SAP domains | Integration Architect, CAP Developer, ABAP Cloud Expert |
| **🎨 Skills** | Reusable Claude Code skills | SAP BTP, HANA Cloud, AI Core, Fiori, Integration Suite |
| **⚡ Commands** | Custom slash commands | Code review, deployment, testing workflows |
| **🔌 MCPs** | External service integrations | SAP BTP services, HANA, Integration Suite APIs |
| **⚙️ Settings** | Claude Code configurations | Optimized settings for SAP development |
| **🪝 Hooks** | Automation triggers | Pre-commit, post-completion, notification hooks |

## Installation

Each component page on [consulting20.com](https://consulting20.com) shows the destination path and content to copy directly into your `.claude/` directory:

- **Agents** → `.claude/agents/filename.md`
- **Skills** → `.claude/skills/filename.md`
- **Commands** → `.claude/commands/filename.md`
- **MCPs** → add config to `.claude/mcp.json`
- **Settings / Hooks** → merge into `.claude/settings.json`

## Stack

- **Dashboard** — Astro 5 SSR + React + Tailwind CSS
- **Database** — Supabase (PostgreSQL)
- **Deployment** — Vercel

## Contributing

We welcome contributions! Open a PR with new agents, skills, commands, or MCPs for the SAP BTP ecosystem.

## Attribution

This project builds on the open-source Claude Code community. The following repositories inspired components in this collection:

- **[davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)** — MIT License
- **[anthropics/skills](https://github.com/anthropics/skills)** — Official Anthropic skills
- **[wshobson/agents](https://github.com/wshobson/agents)** — MIT License
- **[obra/superpowers](https://github.com/obra/superpowers)** — MIT License
- **[awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)** — CC0 1.0

Each resource retains its original license and attribution as defined by their respective authors.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔗 Links

- **🌐 Marketplace**: [consulting20.com](https://consulting20.com)
- **💬 Issues**: [GitHub Issues](https://github.com/consulting2-0/agentic-marketplace/issues)

---

Made with ❤️ in Amsterdam by [Sudip](https://www.linkedin.com/in/sudiphcp/) & Claude Code
