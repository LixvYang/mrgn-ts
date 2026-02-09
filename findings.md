# Findings & Decisions

## Requirements
- User asked to check the build result and attempt a fix.
- Target command is filtered turbo build over 7 packages.
- Current hard failures are in `@mrgnlabs/mrgn-state` TypeScript build only.

## Research Findings
- Reported errors show mixed `@solana/web3.js` versions (`1.98.0` and `1.98.4`) across type boundaries.
- First failure in `packages/mrgn-state/src/config/app.config.ts` at `new AnchorProvider(connection, dummyWallet, ...)` due to `Connection` private field mismatch.
- Second failure in `packages/mrgn-state/src/hooks/derived/use-marginfi-client.ts` at `new AnchorProvider(program.provider.connection, wallet, ...)` due to wallet signature type mismatch tied to duplicate `web3.js` types.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Start with local root cause inspection in `mrgn-state` and dependency tree | Fastest path to minimal safe fix |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| session-catchup produced no output | Proceeded; no unsynced context indicated |

## Resources
- `packages/mrgn-state/src/config/app.config.ts`
- `packages/mrgn-state/src/hooks/derived/use-marginfi-client.ts`

## Visual/Browser Findings
- N/A (terminal-only investigation)
