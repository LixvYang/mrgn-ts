# Task Plan: Fix build failures in selected packages

## Goal
Fix `pnpm run build --filter=marginfi-client-v2 --filter=mrgn-state --filter=mrgn-toasts --filter=mrgn-ui --filter=mrgn-utils --filter=fluxor-state --filter=mrgn-common` so all listed packages build successfully.

## Current Phase
Phase 1

## Phases
### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Root Cause Analysis
- [ ] Reproduce build failure locally
- [ ] Inspect offending files and type sources
- [ ] Identify minimal fix strategy
- **Status:** in_progress

### Phase 3: Implementation
- [ ] Apply targeted code/config fixes
- [ ] Keep changes minimal and scoped
- [ ] Rebuild affected packages
- **Status:** pending

### Phase 4: Verification
- [ ] Re-run full requested filtered build command
- [ ] Confirm no regressions in affected package builds
- [ ] Document outcomes in progress.md
- **Status:** pending

### Phase 5: Delivery
- [ ] Summarize root cause and code changes
- [ ] Provide modified files and verification results
- [ ] Call out any residual risk
- **Status:** pending

## Key Questions
1. Why are `@solana/web3.js` and wallet/provider types mismatching in `mrgn-state`?
2. Is fix best done by dependency alignment or local type boundary adaptation?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use planning-with-files workflow for this task | Multi-step debug + edits + verification |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| TS2345 type mismatch between two `@solana/web3.js` versions in `mrgn-state` build | 1 | In progress |

## Notes
- Keep fix minimal and avoid broad dependency churn unless required.
