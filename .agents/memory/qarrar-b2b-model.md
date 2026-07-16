---
name: qarrar B2B collaboration model
description: Core rules of the team/voting/finalization model in the قرار app
---
- Access rule: a decision is readable by its creator OR any member of its team; structural edits (options/criteria, delete, decide) are creator-only.
- Voting: ratings are per-user, unique on (option, criterion, user); scores = average per-user score per criterion across voters, then weighted. Voter count reported.
- Finalization is one-way: once status='decided', re-decide, voting, and option/criterion mutations are all rejected (app-level guards in every mutation route). **Why:** governance/traceability is the product's core value.
- Rating writes must stay an atomic `onConflictDoUpdate` upsert — slider UIs fire rapid concurrent requests; read-then-write caused unique-violation 500s.
- Invite codes are static, non-expiring, visible to all members — accepted tradeoff for current scope; rotate/expiry is the known enterprise-hardening gap.
- AI suggestion feature deliberately skipped: user declined providing OPENAI_API_KEY (July 2026) and Replit AI integration was blocked on phone verification.
- Destructive DDL goes through raw `psql "$DATABASE_URL"` (drizzle push is TTY-interactive); keep Drizzle schema files in sync manually.
