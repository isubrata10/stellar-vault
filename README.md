# StellarVault
A complete production-style collaborative savings/escrow dApp built on the Stellar Network (Soroban).

## Project Architecture
StellarVault demonstrates advanced Soroban smart contract techniques, including:
- Inter-contract communication (`Vault` → `Treasury`)
- Secure authorization models
- Real-time blockchain event streaming
- Modern Next.js React Frontend using Freighter

## Development
- `contracts/vault`: The primary logic and state tracker.
- `contracts/treasury`: The secure token vault holding XLM/tokens.
- `frontend/`: The Next.js UI using vanilla CSS.

## CI/CD Pipeline
StellarVault is integrated with GitHub Actions for Continuous Integration.
The automated `.github/workflows/ci.yml` workflow runs on every push and pull request to the `main` branch.

### Automated Checks Include:
- **Smart Contracts:**
  - Rust format checking (`cargo fmt --check`)
  - Target optimization build (`wasm32v1-none`)
  - Full cargo test suite verification
- **Frontend:**
  - `npm ci` with caching
  - Linter (`npm run lint` or equivalent)
  - Strict TypeScript typechecking (`tsc --noEmit`)
  - Vitest Unit Testing (`npx vitest run`)
  - Next.js Production Build (`npm run build`)

*The pipeline must pass all steps; otherwise, the commit/PR is flagged as failing.*

## Deployment
See `docs/deployment.md` for live Testnet contract addresses and invocation examples.
To deploy your own instance, run `./scripts/deploy.sh`.
