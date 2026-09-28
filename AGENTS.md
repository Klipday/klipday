# Mandatory Documentation Lookup (Context7)

- Always consult the latest official documentation via Context7 before installing new packages, upgrading dependencies, or writing code
  against external libraries.
- First resolve the library's Context7 ID using `mcp__context7__resolve-library-id` with the official package name.
- Query the docs using `mcp__context7__query-docs` for the specific feature, component, hook, or API endpoint you intend to implement.
- Write code strictly against what the current Context7 documentation specifies — never rely on memory, outdated tutorials, or hallucinated
  APIs.
- Apply this rule to all core dependencies including React Router, TanStack Query, React Hook Form, Zod, Radix UI, Prisma, Express, and
  Axios.

# Modular Feature Architecture

- Organize both backend (`backend/src`) and frontend (`frontend/src`) strictly by feature modules (`src/features/<feature>/`), never by
  technical layer.
- Never create top-level `routes/`, `controllers/`, `services/`, `pages/`, or `layouts/` directories.
- In the backend, colocate everything belonging to a feature in its folder: routes (*.routes.ts), handlers (*.handlers.ts), schemas (*.schemas.ts), validators (*.validators.ts), constants (*.constants.ts), helpers, and feature-specific middleware.
- Colocate feature constants in *.constants.ts: Store all domain limits, whitelists, select projections, and error/validation message dictionaries (<FEATURE>_MESSAGES) in the feature's *.constants.ts file; never scatter inline magic strings or raw numbers across schemas, validators, or handlers.
- In the frontend, colocate everything belonging to a feature in its folder: `components/`, `hooks/`, `layouts/`, `pages/`, `schemas/`,
  `utils/`, `api.ts`, and `types.ts`.
- Reserve `src/components/ui/` exclusively for shared design system primitives installed via shadcn/ui.
- Reserve `src/lib/` exclusively for shared client utilities, API client instances (`api-client.ts`), and global utility helpers
  (`utils.ts`).
- Root orchestrator files (`app.ts`, `App.tsx`) must only mount routers, feature layouts, and top-level providers.

# Frontend Component & Page Architecture

- Strictly enforce the Single Responsibility Principle: each component must do exactly one job and remain small and focused.
- Pages and layouts are pure orchestrators: they compose components, wire routes, and manage placement; they must never contain detailed UI
  implementations or inline business logic.
- Wizard form steps must be self-contained workers: zero required props, own their `useForm()` and `zodResolver`, read context/params
  directly, connect to feature mutations, and manage their submission lifecycle.
- Strict prop interface colocation in `types.ts`: NEVER declare component, subcomponent, layout, or route guard prop interfaces (e.g. `ProtectedRouteProps`) inside component (`*.tsx`) or layout files. Always declare and export them strictly inside the feature's `types.ts` (compile-time pure) and import them into components via `import type`.
- Extract form defaults, data extractors, and transformation mappers into the feature's `utils/` folder rather than declaring them inside
  form components, making them reusable and testable.
- Avoid defensive callback checks for guaranteed props: make standard callbacks required on prop interfaces and avoid writing unnecessary
  `callback ? callback() : null` branches.
- Implement route code-splitting with Data Router: use `createBrowserRouter` + `<RouterProvider />` with `React.lazy()` for all feature step
  pages and routes to keep initial bundle sizes minimal.
- Use targeted Suspense fallbacks: render dedicated feature skeleton components (`CampaignStepSkeleton`) inside layout outlets to prevent
  Cumulative Layout Shift (CLS) and screen flicker during step navigation.
- Implement unsaved changes navigation guards: combine React Router's `useBlocker` (client-side transitions) and `useBeforeUnload` (browser
  tab/refresh) with saving-state bypass (`isPending || isSuccess`).
- Zero speculative props on self-contained components: when a component manages its own state, reads/writes URL search params, or connects directly to TanStack Query hooks (e.g. `CampaignStatusTabs`), keep its prop interface minimal (`className?: string`). Never introduce speculative passthrough props (`counts`, `activeStatus`, `onStatusChange`) that are not actively required by orchestrators.
- Dedicated empty and error state components: never inline contextual empty states or error recovery cards with retry buttons inside list or grid orchestrators. Always extract them into small, dedicated feature components (e.g. `CampaignStatusEmptyState`, `BrandCampaignsErrorState`) to preserve the Single Responsibility Principle.

# Modern Minimalist UI & Anti-AI Slop Design

- Eliminate decorative icon spam ("AI Slop"): never place decorative icon boxes or badge backgrounds next to every section title, heading,
  or paragraph.
- Reserve icons strictly for clear functional actions (edit, delete, add, back, external link), file formats, or real status indicators
  (checks, warning triangles, spinners).
- Enforce a calm, disciplined typographic hierarchy: use `font-semibold` or `font-medium` with subtle tracking (`tracking-tight`); avoid
  aggressive `font-bold` or oversized headers.
- Eliminate redundant titles: never repeat the step title three times (e.g. stepper label, card header, and sub-section header); keep titles
  focused directly on the active task.
- Neutralize callout banners: use calm, muted neutral backgrounds (`border-border/60 bg-muted/30 text-muted-foreground`) for onboarding
  tips; reserve orange strictly for real system warnings and red for errors.
- Flatten layouts and avoid "Box Syndrome": use clean hairline dividers (`border-t border-border/40` or `divide-y`) and whitespace instead
  of endlessly nesting cards inside cards.
- Always use official shadcn/ui primitives from `src/components/ui/`: never hand-roll custom form elements or use unstyled HTML inputs with
  ad-hoc styling.
- Radix `Slot` / `asChild` styling rule: never pass dynamic styling functions to `className` on components passed into Radix primitives via
  `asChild`; precalculate active styles using `useLocation()` and pass static strings.
- Seamless edge-to-edge segmented controls: when creating tab or pill bars enclosed in a container border, avoid container inner padding (`p-1`) that leaves awkward unfilled notches or dark corners on the first and last tabs. Always use edge-to-edge styling (`p-0`, `overflow-hidden`, `divide-x`, and matching boundary radii `first:rounded-l-* last:rounded-r-*`) so active backgrounds fill 100% of their segment right to the container's outer rounded border.
- Platform primary consistency for main actions & step indicators: keep main action buttons (Next, Submit, primary CTAs) and active step indicator buttons consistently styled with the platform's brand primary color (`bg-primary text-primary-foreground hover:bg-primary/90`), while keeping card borders, backgrounds, callouts, and content areas clean, calm, and neutral (avoiding aggressive saturated red-tinted card backgrounds or heavy crimson card borders) to maintain brand cohesion without creating visual clutter or false error states.

# Backend Fast-Fail & Security Guards

- Always fail fast in API handlers: exit early with an immediate `return` the moment any guard condition fails — never nest business logic
  inside multi-level `if` blocks.
- Enforce strict guard execution order: Authentication (401) → Role boundary from JWT payload (403, zero DB hit) → Resource ownership check
  (404) → Request body validation (400) → Database write.
- Combine existence and tenant ownership into a single Prisma query: use relation filters in `where` (e.g.
  `findFirst({ where: { id, brand: { accountId: account.sub } } })`) instead of separate lookups and code comparisons.
- Always return 404 "Not Found" for ownership mismatches: never return 403 for existing resources belonging to other tenants to prevent
  resource existence enumeration attacks.
- Standardize all API responses via shared helpers: always use `SendSuccess` and `SendError` from `backend/src/utils/api-response.ts` so
  every response has the shape `{ status, data, message }`. Never call `res.json(...)` directly.
- Use zero-dependency streaming for file uploads: stream incoming binary uploads directly to storage with `TransformStream` byte counting
  for DoS defense without buffering files into memory; commit database records only upon form save.

# Prisma & Database Conventions

- Mandatory soft-delete filter: every Prisma query targeting models with the `Status` enum (`Account`, `Brand`, `Creator`, `Campaign`,
  `CampaignMaterial`, `CampaignBrief`, `Submission`) must filter `status: ACTIVE` in `where`.
- When a unique lookup requires an additional soft-delete or tenant filter, always use `findFirst` instead of `findUnique`.
- Distinguish soft-delete status from lifecycle status: on `Campaign`, `status` is the soft-delete enum (`ACTIVE`/`DELETED`), while
  `campaignStatus` is the lifecycle enum (`DRAFT`, `IN_REVIEW`, `REVISION`, `REJECTED`, `ACTIVE`, `FINISHED`).
- Handle database uniqueness errors gracefully: map Prisma error code `P2002` to a 409 Conflict with clear error messages (soft-deleted rows
  still occupy unique database indexes).
- Extract relational query builders: encapsulate complex nested query structures (e.g. `CampaignMaterial` updates, `CampaignBrief` upserts)
  in dedicated helper functions rather than building deep literals inline.
- Avoid repetitive `if` blocks in relational upserts: use shared data dictionaries and loop over entries to populate update payloads for
  defined values cleanly.
- Keep payload and Zod schema keys aligned directly with Prisma model column names (e.g. `callToAction` rather than `cta`) to eliminate
  unnecessary normalization layers.
- Always assign query objects and upsert payloads to named variables before passing them into Prisma methods or returning them.

# State Management & API Integration

- Centralize API error decoding: use `ExtractApiError` from `@/lib/api-client` to parse backend `{ message }` responses, falling back to
  Axios network errors, then localized defaults; never duplicate inline `isAxiosError` logic.
- Differentiate cache invalidation from cache clearing: use `queryClient.invalidateQueries` after mutations to trigger seamless background
  refetches; reserve `queryClient.clear()` strictly for logout to wipe in-memory tenant state.
- Keep `types.ts` strictly compile-time pure: store only TypeScript interfaces, types, and DTO contracts with zero runtime overhead;
  colocate derived types (`z.infer`, `as const` tuples) with their runtime schemas and re-export them.
- Standardize field character length tracking: use `FieldLengthTracker` with accessible live announcements and responsive color transitions
  ($<90\%$ muted, $\ge 90\%$ amber, $\ge 100\%$ destructive).
- Lean Query Performance & Prisma `_count`: Directly pass through Prisma `_count` aggregations (e.g. `_count: { submissions: number }`) in lean card and list responses to eliminate server-side mapping loops and unnecessary object allocations, while maintaining strict compile-time types across backend and frontend contracts.
- Standardized API function envelope unwrapping: all client API functions in `api.ts` must cleanly unwrap the backend `{ data: { data: T } }` envelope into a named `result` variable before returning (`const response = await apiClient.get<ApiResponse<T>>(...); const result = response.data.data; return result;`), and wrap the network call in a `try/catch` block that transforms Axios failures via `ExtractApiError(error, '<localized message>')`.


# Code Style & Clean Code Principles

- Use PascalCase for all function names: apply PascalCase to all declared functions and arrow functions assigned to variables (e.g.
  `SendError`, `CreateApp`, `GetCampaignById`); use camelCase for non-function values and instances.
- Provide JSDoc comments on every function: clearly document what the function does, its `@param` definitions, and its `@returns` value.
- Store function results in named variables first: do not execute functions inline inside object literals or argument lists; assign the
  result to a descriptive variable before referencing it.
- Write comments that explain _why_, not _what_: only add comments where the logic is non-obvious, tricky, or works around an external
  constraint; never narrate self-explanatory code.
- Prefer simple, flat, readable code over clever abstractions: use clear, descriptive names and avoid deep nesting.
- Maintain zero tolerance for TypeScript `any`: define strict interfaces, union types, and type guards across both frontend and backend.

# Quality Assurance & Verification Workflow

- Verify changes before reporting completion: always run backend typecheck (`npm run typecheck`), frontend typecheck (`npx tsc --noEmit`),
  linter (`npm run lint`), and production build (`npm run build`).
- Treat warnings and errors with zero tolerance: do not consider any task complete if the compiler, linter, or bundler produces errors.
- Keep modifications minimal and strictly scoped to the task: do not introduce speculative abstractions or opportunistic refactors outside
  the assigned scope.
- Never execute git mutations (commit, push, checkout, stash) unless the user explicitly requests it.
- Align code with product specifications: treat `PRD.md` as the definitive functional specification, and proactively update the PRD if scope
  or architecture decisions evolve.

# Continuous Learning & Lessons Learned Capture

- Proactively update `AGENTS.md` whenever the user verifies, corrects, or establishes a new architectural pattern, convention, or design
  preference (e.g. fast-fail returns, single-query ownership checks, anti-slop UI standards, streaming uploads).
- Treat `AGENTS.md` as a living, self-improving engineering handbook that continuously evolves with every completed feature and user
  feedback cycle.
- Persist valuable lessons immediately: never let critical architectural discoveries, library gotchas, or recurring user feedback vanish in
  chat history.
- Ensure all newly recorded lessons strictly adhere to the standardized format (`# <Title>` followed by flat `- Point` bullet items) with
  clear, actionable rationale.
- Systematically review and cross-reference recorded lessons before developing new feature modules to ensure past pitfalls are never
  repeated.
- Zero tolerance for inline prop declarations: Always declare component, route guard, and layout prop interfaces directly in the feature's `types.ts` from the very start; never declare interfaces inline within component `.tsx` files.
- Role-Guarded Status Badges: internal lifecycle status badges (`IN_REVIEW`, `ACTIVE`, `FINISHED`, `REVISION`) are strictly reserved for administrative or owning tenant roles (`BRAND`, `ADMIN`), while public worker or creator roles (`CREATOR`) must see clean marketplace views without internal review statuses.
- Lifecycle Redirection Guard: detail routes must automatically inspect entity status and redirect incomplete or draft entities (`DRAFT`, `REVISION`) back to their respective wizard step paths, guaranteeing users never land on unfinalized records in a read-only detail view.
- Collapsible Accordion Sections for Creative Brief & Materials: Instead of slide-over Sheet drawers or separate popups, render creative guidelines, social requirements, and downloadable clipping assets directly on the detail page using collapsible dropdown accordion sections ("Wajib ada di video kamu", "Narasi", "Hashtag", "Rekomendasi Hook", "Materi Clipping"). This keeps the flow fast, in-context, and easily accessible without modal disruption.
- Anti-AI Slop Sidebar Hygiene: In campaign detail sidebars, avoid busy decorative tags (MIN, MAKS, POTENSI badges) and redundant tooltip icons on standard financial metrics. Keep the max earnings callout neutral without loud primary/red tints, and avoid redundant escrow guarantee notices in detail overviews to maintain a clean, modern, and professional aesthetic.
- Post-First Video Submission Model: Creators upload directly to social platforms (TikTok) first and submit live video links; legacy direct file upload requirements are superseded by `liveVideoUrl`, reducing platform bandwidth costs and matching market standards (Konten.com, Clippo.id).
- Anti-Hijacking Social Account Constraints: Enforce database-level unique index on `CreatorSocialAccount` (`@@unique([platform, username])`) so no social handle can be linked or claimed by multiple creators on the platform.
- One-Time Bio Verification Handshake: Use temporary tokens (`KD-XXXX`, 10-minute expiry, 60-second CDN propagation cooldown) to verify profile ownership via social scrapers. Once verified, permanently link the account and permit creators to remove the code immediately from their bio.
- Isolated Submission Review Queues: Brand and admin campaign submission queries must explicitly filter `where: { submissionStatus: { not: 'JOINED' }, status: 'ACTIVE' }` to ensure joined creators who have not yet submitted a video never clutter review tables.
- In-Context Modal Video Submission Dialog: Replace multi-page submission wizard routes (`/campaigns/:id/submit/step-*`) with a 2-column split modal `Dialog` directly on the campaign detail page. Keep the left column for campaign poster/CPM/metrics context and the right column for a compact horizontal stepper and step form (Brief -> Account -> Video Picker -> Submit), maximizing speed and eliminating multi-page routing overhead and draft recovery complexity for clippers.
- Multi-Platform Account Selection & Verification Lifecycle: In creator social linkage steps, separate multi-platform card selection (supported vs locked unsupported) from the verification handshake dialog. Mount connect modal content fresh on open to initialize state purely from database records rather than relying on effect-based state synchronization, and ensure controlled username inputs never fall back to default values when emptied so creators can freely change handles.
- Modal Exit Confirmation Guard: When creators engage in multi-step submission or wizard dialogs, prevent accidental closures from backdrop clicks, Escape keys, or header close buttons by intercepting close triggers and rendering a focused `AlertDialog` confirmation ("Tinggalkan Pengajuan Video?"). Bypass confirmation only upon successful mutation completion.
- Zero Technical Jargon in User-Facing Copy: Never expose system architecture, networking, or infrastructure terms (e.g. "CDN", "sinkronisasi CDN", "handshake", "payload", "endpoint") in UI labels, countdowns, buttons, or toasts. Always write from the end-user's perspective using natural, conversational language (e.g. replace "Sinkronisasi CDN (12s)..." with "Tunggu sebentar (12s)...").
- Idempotent Social Account Connection & Verification Guard: When a creator opens the account change dialog ("Ganti Akun") but submits the same username that was already previously connected and verified on that platform, never generate a new verification code (`KD-XXXX`) or invalidate their verified status. Instead, display an informative toast (`Akun @username sudah terhubung.`), notify the parent callback, and close the dialog cleanly. In the backend, guard against code generation for existing verified accounts owned by the same creator and auto-heal `isVerified` if previously marked unverified.
- Persistent Social Avatar Storage: Social platform CDNs (notably TikTok CDN signed URLs) contain temporary security signatures (`x-expires`) that expire after 24–48 hours, returning `403 Forbidden` (`failure-expired`) and causing broken avatars. Persist scraped social avatars directly to permanent Supabase Storage upon verification, auto-migrate legacy/expired CDN URLs on retrieval, and wrap frontend avatars with Radix `Avatar` (`AvatarImage` + `AvatarFallback`) to guarantee robust fallback without broken icon layout shifts.
- Single Active Social Account per Platform Lifecycle: When creators connect a new social handle on a platform (e.g. TikTok), historical records in `CreatorSocialAccount` must remain in the database (never hard-deleted) to protect historical `Submission` foreign keys and brand review audit trails. However, to guarantee a single active identity, always deactivate verification on prior accounts for that creator (`isVerified: false`) upon new verification, and enforce deterministic retrieval using `orderBy: { verifiedAt: 'desc' }` across all social and submission queries.
- Cross-Step Video Invalidation on Account Switch: When a creator changes their connected social account in Step 2 of the submission modal dialog, any video chosen in Step 3 must be immediately cleared (`selectedVideo = null`), draft videos from mismatched accounts discarded, recent video queries keyed by username (`['recent-tiktok-videos', username]`), and Step 4 locked (`maxStepReached = 3`) until a video belonging to the new handle is selected.
- Dual-Layer Error Localization for Auth & Form Workflows: Always implement error translation at both backend and frontend layers. At the backend layer, emit clean, user-friendly Indonesian messages directly from handlers, middleware, rate-limiters, and Zod schemas. At the frontend layer, encapsulate a client-side error mapper (`TranslateAuthError`) inside feature `utils/` and apply it in API functions to guarantee that even unexpected network, proxy, or legacy backend error strings are translated into natural, conversational Indonesian before reaching UI components.
- Centralized Feature Constants & Zero Magic Strings in Validation Schemas: All Zod validation schemas, domain limit thresholds (e.g. file sizes, pagination limits), status arrays, and API response/error messages must be declared as constant collections in the feature's *.constants.ts file (e.g. CAMPAIGN_MESSAGES, AUTH_MESSAGES, DEFAULT_LIMIT, ALLOWED_MIME_TYPES). Never inline magic strings or raw literals directly within *.schemas.ts, *.validators.ts, or handler files. This guarantees consistency across API error responses, facilitates localization or text updates, prevents typo-induced bugs, and enables seamless reuse across unit tests.
- Dedicated Social Verification Table: Do NOT persist temporary verification codes or unverified handles in CreatorSocialAccount prior to proof of ownership. Store pending verification challenges in a dedicated SocialVerificationCode table (keyed by @@unique([creatorId, platform, username])) and commit records to CreatorSocialAccount ONLY upon successful live bio verification, completely preventing username squatting, multi-instance cache loss, and unverified database pollution.
- Persistent Video Thumbnail Storage & Auto-Migration: Ephemeral TikTok CDN video covers contain signed session tokens and temporary expiry parameters (`x-expires`) that return `403 Forbidden` after 24–48 hours or block cross-origin browser image requests. Mirror the social avatar approach by persisting scraped video thumbnails directly to permanent Supabase Storage (`submissions/thumbnails/`) strictly upon draft saving and final submission, avoiding wasteful bulk storage uploads and latency during profile video browsing in Step 3. In review queries (`GetCampaignSubmissions`, `GetMyCampaignSubmission`), proactively auto-migrate legacy external CDN thumbnails to Supabase Storage, and fallback to re-scraping live video details via `GetTikTokVideoDetails(liveVideoUrl)` when old CDN links have already expired. In the frontend, handle `onError` on all submission thumbnail preview components with clean neutral fallback icons to completely eliminate broken image layout shifts.
