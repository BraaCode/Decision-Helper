# Qarrar — Business Plan

## 1. Executive Summary

**Qarrar** (قرار, Arabic for "decision") is an Arabic-first, RTL-native SaaS platform that helps individuals and teams make better, more transparent decisions through weighted scoring, collaborative voting, and one-way finalization with a full audit trail.

While weighted decision matrices are a proven methodology (Pugh Matrix, 1970s), no existing product serves the Arabic-speaking market with proper RTL UX, regional compliance expectations, or governance-grade traceability. Qarrar closes that gap and layers an AI assistant on top to move the product from *calculator* to *advisor*.

**Mission:** Make group decision-making transparent, auditable, and culturally native for Arabic-speaking teams.

**Vision:** Become the default decision-intelligence platform for organizations across the MENA region and Arabic-speaking diaspora.

## 2. The Problem

- **Teams make high-stakes decisions opaquely.** Hiring picks, vendor selections, and project priorities are decided in chat threads and spreadsheets with no record of *why*.
- **Arabic speakers are underserved.** Existing tools (Melissa, DecisionApp, spreadsheets) are English-only with broken or absent RTL support.
- **Spreadsheets don't govern.** They calculate, but don't lock decisions, log who voted how, or produce an audit trail acceptable to compliance or board review.
- **Bias goes unchecked.** No existing consumer-accessible tool surfaces anchoring, groupthink, or low-confidence rating patterns.

## 3. The Solution

Qarrar turns any decision into a structured, traceable record:

1. **Frame** the decision as a question.
2. **Add options** (2–5) and **weighted criteria** (importance 1–5).
3. **Rate** each option per criterion — solo or as a team (per-user ratings averaged).
4. **Finalize** — one-way lock that freezes voting and edits, generates a rationale memo, and writes an immutable audit-log entry.
5. **Export** to PDF for records, or recycle (soft-delete) if abandoned.

Differentiators:
- Arabic-first RTL UX with full localization
- One-way finalization + audit log (governance angle)
- Team collaboration with invite codes and per-voter averaging
- Prebuilt templates (hiring, vendor selection, procurement, project priority, office location)
- AI layer: suggests criteria from free-text, flags bias, drafts justification memos

## 4. Market Analysis

### Target market
Primary: Arabic-speaking knowledge workers and SMB teams (50–500 employees) in Saudi Arabia, UAE, Egypt, and the diaspora.

### Market sizing (bottom-up, conservative)
- **TAM:** ~2.5M Arabic-speaking knowledge workers in decision-making roles across MENA + diaspora.
- **SAM:** ~600K workers in SMBs and mid-market teams that already use structured collaboration tools (Slack, Teams, Notion).
- **SOM (Year 3):** ~12K paid seats across ~1,800 teams (2% of SAM).

### Trends supporting adoption
- Saudi Vision 2030 and UAE digital-transformation mandates push organizations toward auditable, transparent processes.
- GRC (governance, risk, compliance) budgets growing ~12% YoY in the GCC.
- Arabic NLP maturity (Jais, ALLaM) makes localized AI features viable for the first time.

## 5. Business Model

B2B SaaS subscription, per-seat pricing, monthly and annual billing.

| Stream | Description | Share of Y2 revenue |
|--------|-------------|---------------------|
| Team subscriptions | Per-seat pricing for collaborative teams | 70% |
| Pro (individual) | Power users and solo consultants | 20% |
| Enterprise | Custom contracts, SSO, on-prem options | 10% |

## 6. Competitive Landscape

| Competitor | Strength | Gap Qarrar exploits |
|------------|----------|---------------------|
| Spreadsheets | Universal, free | No governance, no RTL, no AI |
| Melissa / DecisionApp | Polished UX | English-only, no team audit trail |
| Notion / Airtable | Flexible | Decisions are not a first-class object; no finalize-lock |
- Loom surveys | Fast polling | No weighted scoring, no rationale |

**Defensibility:** Arabic-first positioning, audit-trail moat (once an org's decision history lives in Qarrar, switching costs rise), and AI suggestions trained on regional decision patterns.

## 7. Go-to-Market

**Phase 1 (Months 1–6):** Land 10 design-partner teams (free, feedback-driven) in Saudi/UAE SMBs. Build case studies.

**Phase 2 (Months 6–12):** Public launch with Pro and Team tiers. Content marketing in Arabic (decision-framework blog, LinkedIn thought leadership). Target 200 paid teams.

**Phase 3 (Year 2):** Enterprise motion with SSO, custom templates, and compliance exports. Channel partnership with a regional HR/procurement consultancy.

See `marketing-strategy.md` and `sales-forecast.md` for detail.

## 8. Operations & Team

Year-1 lean team:
- 2 founders (product + GTM)
- 2 engineers (full-stack, Arabic NLP)
- 1 designer (RTL specialist)
- 1 part-time customer success

Infrastructure: Supabase (Postgres + Auth + Edge Functions), Vercel-style hosting, Clerk auth, OpenAI/Jais for AI features.

## 9. Financial Overview

See `sales-forecast.md` for the full model. Headline figures:

- **Year 1 ARR:** ~$96K (200 teams, blended $40/seat-month equivalent)
- **Year 2 ARR:** ~$420K (900 teams + first enterprise deals)
- **Year 3 ARR:** ~$1.3M (1,800 teams, enterprise expansion)
- **Break-even:** Month 22 (base case)
- **Gross margin:** ~78% (hosting + AI inference as primary COGS)

## 10. Milestones

| Quarter | Milestone |
|---------|-----------|
| Q1 | MVP live, 10 design partners |
| Q2 | AI criteria-suggestion shipped, public Pro/Team launch |
| Q3 | 100 paid teams, first case study published |
| Q4 | 200 paid teams, enterprise tier in beta |
| Y2 H1 | SSO, audit-log export, 500 teams |
| Y2 H2 | First enterprise contract signed, 900 teams |
| Y3 | Channel partnership, 1,800 teams, break-even |

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Low willingness to pay in region | Medium | Anchor on governance value, not "productivity"; offer annual discounts |
| AI inference costs outpace revenue | Medium | Cache suggestions, use tiered models (Jais for Arabic, GPT for English) |
| Spreadsheet inertia | High | Templates + import-from-sheets; show audit-trail value to compliance owners |
| Larger player adds RTL | Low–Medium | Ship audit-trail moat fast; build community before competitors notice |
| Currency/payment friction | Medium | Support local payment methods (Mada, STC Pay) alongside Stripe |

---
*Document version: 1.0 — basis for hackathon pitch and early investor conversations.*
