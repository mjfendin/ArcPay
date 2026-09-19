# ArcPay — USDC Payment Links on Arc

> **Request USDC. Share a link. Get paid on Arc.**

Production-ready USDC payment infrastructure built on **Arc Mainnet** (chain ID
5042), where USDC is the native gas token. Turn any USDC payment request into a
simple, shareable link — the payer never needs to understand blockchain
terminology.

- **Live demo:** https://arc-payments.vercel.app
- **Network:** Arc Mainnet (`5042`) / Arc Testnet (`5042002`)

---

## What it does

| Feature | Status |
| --- | --- |
| Create USDC payment links | ✅ |
| Public checkout page (`/pay/:id`) | ✅ |
| Wallet connection (multi-wallet via wagmi) | ✅ |
| USDC balance + insufficient-funds detection | ✅ |
| Authoritative on-chain payment verification | ✅ |
| QR code per payment link | ✅ |
| Share everywhere (X, Telegram, WhatsApp, email) | ✅ |
| Merchant dashboard (`/dashboard`) | ✅ |
| Payment link types (request, invoice, checkout, donation, tip, payme) | ✅ schema + API |
| Pay Me profile (`/:handle`) | ✅ |
| Embeddable payment button (`/embed`) | ✅ |
| Developer API (`/developers`) | ✅ |
| Dynamic SEO/OG metadata per link | ✅ |
| Webhooks | 🔜 dispatcher ready, auth pending |
| Recurring payments / subscriptions | 🔜 architecture only (no custodial recurring) |
| Cross-chain "Fund on Arc" (CCTP/Gateway) | 🔜 extensible placeholder |

---

## Tech stack

- **Next.js 16** (App Router, Route Handlers, dynamic metadata)
- **React 19 + TypeScript**
- **wagmi v3 + viem** (Arc chains built into viem)
- **Reown AppKit** (project-id optional; injected multi-wallet works without it)
- **Vercel KV** in production, JSON file store for local dev
- **Tailwind CSS v4**

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── payments/            # POST create · GET list
│   │   │   └── [id]/
│   │   │       ├── route.ts     # GET link · PATCH cancel
│   │   │       ├── verify/      # GET authoritative on-chain status
│   │   │       └── confirm/     # POST tx hash → server verifies receipt
│   │   └── profile/             # Pay Me profile create/read
│   ├── [handle]/                # Public Pay Me profile page
│   ├── pay/[id]/                # Public checkout (dynamic OG metadata)
│   ├── pay/demo/                # Demo checkout
│   ├── dashboard/               # Merchant dashboard
│   ├── developers/              # API docs
│   ├── embed/                   # Payment button snippets
│   └── page.tsx                 # Landing page
├── components/
│   ├── pay-page-client.tsx      # Wallet + pay flow (client)
│   ├── payment-qr-code.tsx
│   ├── share-payment-link.tsx
│   └── ...
└── lib/
    ├── arc.ts                   # Chain config (single source of truth)
    ├── usdc.ts                  # 6-decimal USDC math + formatting
    ├── types.ts                 # PaymentLink, events
    ├── store.ts                 # Storage abstraction (KV ↔ file)
    ├── verify.ts                # On-chain verification (server)
    └── webhook.ts               # Webhook dispatcher + HMAC
```

## Core invariants (do not regress)

1. **Never trust the client for payment status.** A link is `paid` only when
   the server observes the exact USDC `Transfer` to the recipient in a
   confirmed receipt (`verify.ts`).
2. **USDC is 6 decimals** everywhere except native gas math (18 decimals).
   Never mix them, never double-count them.
3. **Never expose secrets.** `ARC_RPC_URL_*`, `WEBHOOK_SECRET`, KV tokens are
   server-only. Public env is `NEXT_PUBLIC_*` only.
4. **Never fabricate integrations.** "Fund on Arc" (CCTP/Gateway) and
   recurring payments are marked unavailable until verified against live Arc
   Mainnet providers.

## Arc network facts (verified against RPC)

| Field | Mainnet | Testnet |
| --- | --- | --- |
| Chain ID | `5042` | `5042002` |
| RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.network` |
| Explorer | `https://explorer.arc.io` | `https://testnet.arcscan.app` |
| USDC | `0x3600000000000000000000000000000000000000` | same address |
| USDC decimals | 6 (ERC-20 view) | 6 |
| Native gas | USDC, 18 decimals | USDC, 18 decimals |

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_NETWORK=arc-mainnet       # or arc-testnet
NEXT_PUBLIC_REOWN_PROJECT_ID=         # optional — enables AppKit multi-wallet
NEXT_PUBLIC_APP_URL=https://arc-payments.vercel.app
KV_REST_API_URL=                      # production only (auto on Vercel)
KV_REST_API_TOKEN=
ARC_RPC_URL_MAINNET=                  # optional private RPC for verification
ARC_RPC_URL_TESTNET=
WEBHOOK_SECRET=                       # signs webhook deliveries
```

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Home: http://localhost:3000
- Create a link and open `/pay/<id>`
- Dashboard: http://localhost:3000/dashboard

## Build & deploy

```bash
npm run build
```

Deploy to Vercel:
1. Push this repo to GitHub.
2. Import in Vercel.
3. Add the env vars above (KV auto-provisions with Vercel KV integration).
4. Set `NEXT_PUBLIC_APP_URL` to the production URL.

---

**Security note:** This is payment infrastructure. Have the smart-contract
interactions and server verification audited before moving significant value.
Arc Mainnet transactions are real USDC and irreversible.
