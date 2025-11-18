# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo-managed monorepo for marginfi/Fluxor - a Solana-based DeFi lending protocol. The repository contains multiple Next.js frontend applications and shared TypeScript packages for blockchain interaction, state management, and UI components.

## Development Commands

### Setup
```bash
pnpm install  # Install all dependencies
```

### Development
```bash
pnpm dev      # Run all apps in parallel on dev mode
turbo run dev --parallel  # Same as above
```

Individual apps run on specific ports:
- `marginfi-v2-ui` and `fluxor-ui`: Port 3004
- `marginfi-v2-trading`: Port 3006

### Building
```bash
pnpm build    # Build all packages and apps
turbo run build  # Same as above
```

Turbo handles dependency ordering automatically (packages build before apps).

### Linting & Formatting
```bash
pnpm lint     # Lint all packages/apps
pnpm format   # Format all TypeScript files with Prettier
```

### Cleaning
```bash
pnpm clean    # Remove all dist/ and node_modules/
```

### Package Management
```bash
node scripts/workspace-dep.js      # Manage workspace dependencies
node scripts/update-dependencies.js  # Update dependencies
```

### Package-Specific Development

To work on a specific package (e.g., marginfi-client-v2):
```bash
cd packages/marginfi-client-v2
pnpm build       # Build package
pnpm dev         # Watch mode (tsc --watch)
```

To work on a specific app:
```bash
cd apps/marginfi-v2-ui
pnpm dev         # Run only this app
pnpm build       # Build only this app
```

## Architecture

### Monorepo Structure

```
apps/          # Next.js frontend applications
  marginfi-v2-ui/         # Main lending UI (port 3004)
  fluxor-ui/              # Fluxor lending variant (port 3004)
  marginfi-v2-trading/    # Trading platform (port 3006)
  fluxor-ui-v3/           # Next-gen Fluxor UI
  marginfi-landing-page/  # Marketing site
  marginfi-v2-docs/       # Documentation

packages/      # Shared TypeScript packages
  marginfi-client-v2/     # Solana smart contract client
  mrgn-state/             # React Query state management
  fluxor-state/           # Fluxor-specific Zustand state
  mrgn-ui/                # Shared component library
  mrgn-common/            # Solana utilities
  mrgn-utils/             # General utilities & hooks
  mrgn-toasts/            # Toast notifications
  tools/                  # Development tools
```

### Core Package Responsibilities

**`marginfi-client-v2`** (v6.2.1)
- Direct interface to MarginFi smart contracts via Anchor framework
- Exports: `MarginfiClient`, `ArenaClient`, models (`Bank`, `Group`, `Account`, `Balance`)
- Key directories:
  - `clients/` - MarginfiClient, ArenaClient
  - `models/` - Bank, Group, Account, Balance domain models
  - `services/` - Account, bank, group, price, transaction services
  - `idl/` - Anchor IDL files for program interfaces
  - `instructions.ts` - Program instruction builders
- Handles oracle integration (Pyth, Switchboard), bundle simulation, transaction formatting
- Build: `tsc -p tsconfig.json` (outputs to dist/)

**`mrgn-state`**
- React Query-based global state management
- Exports hooks: `useMarginfiClient`, `useBanks`, `useGroups`, `useAccountSummary`, `useEmode`
- Provides context: `WalletState`, `SelectedAccount`
- Fetches data from: Solana RPC, Firebase, oracles, backend APIs
- Services: Pyth oracle, bank charts, portfolio calculations

**`fluxor-state`**
- Zustand stores with persist/devtools middleware
- Specialized for Fluxor lending app
- API client for Fluxor backend (TVL/APY data)
- Mixin wallet integration support

**`mrgn-ui`**
- Shared Radix UI-based component library
- Action boxes: lending, borrowing, looping, staking, deposit-swap
- Each action follows: Input → Preview → Submit flow
- Individual Zustand stores per action type
- Jupiter integration for swaps

**`mrgn-common`**
- Low-level Solana utilities: wallet types, SPL token operations, buffer layouts
- Math utilities (BigNumber, Decimal.js)
- Transaction constants and helpers

**`mrgn-utils`**
- Feature gates, analytics (Sentry, PostHog), auth utilities
- Priority fee calculations, RPC utilities, E-mode utils
- Media queries, LST (Liquid Staking Token) helpers

### State Management Architecture

Multi-layer provider tree structure:
```
StateProvider (mrgn-state)           # MarginFi config, RPC connection
  → ConnectionProvider                # Solana Connection
    → WalletProvider                  # Wallet adapter
      → AuthProvider                  # Authentication
        → MrgnWalletProvider          # Wallet UI state
          → ActionProvider            # Transaction settings (fees, broadcast type)
            → App-Specific Providers  # Per-app contexts
```

State layers:
- **React Query**: Server state (banks, groups, oracle data, portfolios) with automatic refetch
- **Zustand**: Client state in action forms and settings
- **React Context**: Configuration, wallet connection, auth state
- **Local/Session Storage**: User preferences, selected accounts

### Transaction Flow

1. **Data Fetching** (`mrgn-state` hooks)
   - Fetch MarginFi groups, banks, oracle prices
   - Load address lookup tables (ALTs) for transaction optimization
   - Fetch user accounts

2. **Client Initialization** (`marginfi-client-v2`)
   - `MarginfiClient` constructed with program, wallet, banks, oracle prices
   - Manages bank state, oracle price aggregation, mint metadata
   - Handles address lookup tables for versioned transactions

3. **Instruction Building**
   - Protocol instructions: deposit, borrow, repay, stake
   - Jupiter integration for swap routes
   - Bundle transactions for atomic execution

4. **Transaction Processing**
   - Multiple broadcast strategies (RPC, bundle, versioned)
   - V0 transactions with lookup tables for size reduction
   - Error handling and retry logic

5. **Oracle Integration**
   - Pyth Network: Push oracle feeds
   - Switchboard: On-demand feeds
   - Price caching and feed ID mapping

### Wallet Support

Multiple wallet adapters supported:
- Phantom, Solflare, WalletConnect, Web3Auth, Tiplink, MoonGate
- Solana Mobile Stack for mobile wallets
- Mixin wallet for Fluxor (cross-chain support)

## IDL Management

When updating the IDL from Anchor programs:

1. Build the Anchor program without feature flags: `anchor build`
2. Copy IDL from `target/deploy/` to `packages/marginfi-client-v2/src/idl/`
3. **Known bug**: Anchor may not generate "errors" in idl.json - manually copy and edit if needed
4. Default configuration is correct for mainnet

## Environment Variables

The monorepo uses ~120+ environment variables defined in `turbo.json` globalEnv. Key categories:

- **RPC Configuration**: `NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE`, `PRIVATE_RPC_ENDPOINT`
- **Program Overrides**: `NEXT_PUBLIC_MARGINFI_PROGRAM_OVERRIDE`, `NEXT_PUBLIC_MARGINFI_GROUP_OVERRIDE`
- **Feature Flags**: `NEXT_PUBLIC_FEATURE_GATES`, `NEXT_PUBLIC_MARGINFI_FEATURES_*`
- **API Keys**: Firebase, Helius, Birdeye, Jupiter, Switchboard, etc.
- **Analytics**: PostHog, Sentry, Convert Kit
- **Deployment**: Vercel-specific variables

Check individual app `.env.example` files for required variables.

## Code Style & Conventions

### ESLint Configuration
- Extends: Next.js, Prettier
- Plugins: Turbo
- Key rules:
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn

### Package Dependencies

Internal workspace packages use `workspace:*` protocol:
```json
"@mrgnlabs/marginfi-client-v2": "workspace:*"
```

### Key Dependency Versions
- Next.js: 14.2.30
- React: 18.2.0
- @solana/web3.js: 1.91.3 - 1.98.0
- @coral-xyz/anchor: 0.30.1
- @tanstack/react-query: 5.80.6
- zustand: 4.4.1
- Node.js: >= 20.0.0

### pnpm Overrides
The root `package.json` includes overrides for:
- React/React-DOM: ^18.2.0
- Solana wallet adapters
- React Query

These ensure version consistency across the monorepo.

## Working with Solana Programs

### MarginFi Program Interaction

The `marginfi-client-v2` package wraps all program interactions:

```typescript
import { MarginfiClient } from "@mrgnlabs/marginfi-client-v2";

// Client initialization handled by mrgn-state hooks
const { client } = useMarginfiClient();

// Models available
import { Bank, MarginfiAccount, Balance } from "@mrgnlabs/marginfi-client-v2";
```

### Oracle Integration

Price feeds come from:
- **Pyth Network**: Real-time push feeds via Pyth programs
- **Switchboard**: On-demand oracle feeds
- Services handle price aggregation and caching (see `packages/marginfi-client-v2/src/services/price.ts`)

### Address Lookup Tables (ALTs)

- Used to optimize transaction size for versioned transactions
- Managed automatically by the client
- Cached and loaded via React Query hooks
- See `packages/mrgn-state/src/utils/lut.ts`

## Testing

Jest is configured for TypeScript testing:
- Config: `jest.config.js` at root
- Preset: `ts-jest`
- Test environment: `node`

Currently no test files exist in the repository. When adding tests:
- Place test files adjacent to source: `*.test.ts` or `*.test.tsx`
- Or use `__tests__/` directories

## Common Development Patterns

### Adding a New Feature to the UI

1. **Determine if action belongs in `mrgn-ui`** (shared) or app-specific
2. **For shared actions**:
   - Create action component in `packages/mrgn-ui/src/components/action-box-v2/`
   - Create Zustand store in `actions/[action-name]/store.ts`
   - Follow pattern: input component → preview component → submit handler
3. **For app-specific features**:
   - Add components to `apps/[app-name]/src/components/`
   - Use existing hooks from `mrgn-state`

### Adding a New Program Instruction

1. **Update IDL** in `packages/marginfi-client-v2/src/idl/`
2. **Add instruction builder** in `packages/marginfi-client-v2/src/instructions.ts`
3. **Create or update model** in `packages/marginfi-client-v2/src/models/`
4. **Add service method** if needed in `packages/marginfi-client-v2/src/services/`
5. **Expose via client** in `packages/marginfi-client-v2/src/clients/`

### Adding State Hooks

1. **For data fetching**: Add React Query hook in `packages/mrgn-state/src/hooks/`
2. **For derived state**: Create custom hook combining existing queries
3. **For client state**: Add Zustand store in `mrgn-ui` action stores

### Working with Different Apps

**marginfi-v2-ui** and **fluxor-ui** share ~80% of code:
- Both use Next.js 14 with App Router
- Main difference: `mrgn-state` vs `fluxor-state`
- Fluxor has Mixin wallet integration

**marginfi-v2-trading** is lighter:
- Focused on trading/derivatives
- Shares `marginfi-client-v2` but different UI approach

## Deployment & Build

### Production Build
```bash
turbo run build
```

This builds packages first (dependency order), then apps.

### Release Process
```bash
pnpm release          # Full release with changeset
pnpm beta-release     # Beta release
```

Uses `@changesets/cli` for versioning and publishing.

## Troubleshooting

### Build Errors

**"Cannot find module '@mrgnlabs/...'"**
- Run `pnpm install` at root
- Ensure workspace packages are built: `turbo run build`
- Check `package.json` uses `workspace:*` for internal deps

**Type errors in marginfi-client-v2**
- Rebuild the package: `cd packages/marginfi-client-v2 && pnpm build`
- Ensure IDL is up to date

### Development Issues

**Hot reload not working**
- Turbo caching issue: `turbo run dev --force`
- Clear turbo cache: `rm -rf .turbo`

**RPC endpoint issues**
- Check environment variables in `turbo.json` globalEnv
- Override with `NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE`

**Transaction failing**
- Check oracle prices are current
- Verify priority fees are set correctly
- Check address lookup tables are loaded

## Important Notes

- **Node version**: Requires Node.js >= 20.0.0
- **Package manager**: Must use pnpm (v10.3.0), not npm or yarn
- **Workspace protocol**: Internal packages use `workspace:*` in dependencies
- **IDL sync**: Always rebuild marginfi-client-v2 after IDL updates
- **Turbo caching**: Build outputs cached in `.turbo/` for performance
- **Environment sync**: All environment variables must be listed in `turbo.json` globalEnv to be available during builds
