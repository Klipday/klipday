# Klipday

A performance-driven short-form video clipping marketplace connecting brands and creators in Indonesia. Brands receive organic viral reach with escrow budget protection; clippers monetize edits per verified view (CPM).

> **Interactive Documentation**: Open [`documentation.html`](file:///C:/Projects/klipday/documentation.html) in your web browser for the clean, minimalist dark-themed developer documentation experience with interactive navigation and workflow breakdowns.

---

## Overview

### The Market Model
Klipday connects commercial demand for viral social media content with video editors and clippers looking to monetize their short-form production skills.
- **Brands & MSMEs**: Avoid expensive agency retainers and unmeasured influencer costs. Set a target CPM (e.g. Rp15,000 / 1K views) and pay strictly for verified view performance.
- **Clippers & Creators**: Earn by creating engaging TikTok edits from brand assets. No need to wait for individual sponsorship deals; earn guaranteed payouts backed by escrow.

### Campaign Types
- **Physical Products**: E-commerce, skincare, fashion, F&B, consumer electronics.
- **Digital Content**: Online courses, podcasts, media publications, software products.
- **Services**: Professional services, clinics, educational institutions, travel & hospitality.

---

## User Roles & Workflows

### User Roles
- `BRAND`: Funds wallet, configures campaigns, deposits escrow, and curates video submissions.
- `CREATOR`: Discovers campaigns, connects TikTok account via bio code verification, posts clips, and submits live links.
- `ADMIN`: Audits campaigns, reviews deposit slips, verifies view reports, and executes withdrawals.

### Brand Flow
1. **Wallet Deposit**: Top up account balance via Indonesian bank transfer, Virtual Account, or QRIS.
2. **Campaign Creation**: Build campaign guidelines, set CPM rate, view thresholds, budget, and raw video footage via a 6-step wizard.
3. **Escrow Lock**: Campaign budget is immediately deducted from the wallet and locked in escrow.
4. **Submission Curation**: Review creator videos: Approve, Request Revision (up to 2 rounds), or Reject.
5. **Settlement**: Performance-based payout to creators; unspent escrow funds return to the brand.

### Clipper Flow
1. **Campaign Discovery**: Browse active campaigns and download raw media assets.
2. **TikTok Bio Handshake**: Link TikTok account using a temporary bio token (`KD-XXXX`, 10-minute expiry) verified via scrapers (`@@unique([platform, username])`).
3. **Produce & Post (Post-First Model)**: Publish video edits directly to TikTok adhering to brief guidelines.
4. **Submit Video**: Select the clip via the in-context submission dialog on the campaign page.
5. **Earn Payout**: Receive earnings calculated from verified views × CPM once approved.

---

## Implemented Features

- **Authentication & Roles**: Email + Bcrypt password authentication, JWT claims, HTTP-only cookie sessions, and role guards (`BRAND`, `CREATOR`, `ADMIN`).
- **Brand Wallet & Escrow**: Balance ledger, deposit slip tracking, withdrawal requests, and transactional escrow locking.
- **6-Step Campaign Creation Wizard**: Information, Brief & Guidelines, CPM & View Model, Media Assets, Review Summary, and Escrow Checkout.
- **TikTok Bio Verification Handshake**: Ownership proof token generator, live bio scraping, anti-hijacking database constraints, and permanent asset storage on Supabase Storage.
- **Post-First Video Submission Dialog**: In-context modal with brief agreement, handle confirmation, TikTok feed video picker / URL fallback, and submission status tracking.
- **Brand Curation Queue**: Dedicated management interface for approving clips, requesting revisions, or rejecting submissions.

---

## Tech Stack & Architecture

### Backend (`backend/`)
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express 5.1
- **Database & ORM**: PostgreSQL (Supabase) with Prisma ORM 7.9
- **Validation & Security**: Zod 4.4, Helmet, CORS, Cookie-parser, Bcrypt, JWT

### Frontend (`frontend/`)
- **Framework & Language**: React 19 & TypeScript
- **Bundler & Tooling**: Vite 8
- **Styling**: Tailwind CSS v4, Lucide Icons
- **State & Data Fetching**: TanStack Query v5 & Axios
- **Forms & UI**: React Hook Form, Zod, Radix UI & shadcn/ui primitives
- **Routing**: React Router v8 (Data Router with route code splitting)

### Directory Structure
```text
klipday/
├── backend/
│   ├── prisma/schema.prisma     # PostgreSQL schema & enums
│   └── src/
│       ├── features/            # Feature packages (authentication, campaign, wallet, submission, social-account)
│       ├── middleware/          # Global error handling & auth guards
│       ├── app.ts               # Express configuration & routes
│       └── index.ts             # Server entry point
├── frontend/
│   └── src/
│       ├── components/ui/       # Shared UI primitives (shadcn/ui, Radix)
│       ├── features/            # Feature modules (authentication, campaign, dashboard, submission, wallet)
│       ├── lib/                 # API client & helpers
│       ├── App.tsx              # React router tree & layouts
│       └── main.tsx             # Root render
├── documentation.html           # Minimalist dark-themed interactive documentation
└── README.md                    # Root repository documentation
```

---

## Quickstart Guide

### 1. Prerequisites
- Node.js (>= 20.x)
- npm (>= 10.x)
- PostgreSQL database (local or Supabase)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```
Server runs at `http://localhost:3000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web client runs at `http://localhost:5173` with automated API proxying to port 3000.

---

## Roadmap

- **Phase 2**: Multi-platform support for Instagram Reels and YouTube Shorts.
- **Phase 2**: Automated payout disbursement integration for Indonesian banks and e-wallets.
- **Phase 3**: Automated view scraping engine with fraud detection and daily delta reconciliation.
