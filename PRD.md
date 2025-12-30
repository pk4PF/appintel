# Product Requirements Document
## Project: App Gap (Decision Intelligence)

**Product Type:** Web-based Decision Intelligence Platform  
**Design Archetype:** *The Early Signal Interface*  
**Audience:** Solo founders, indie hackers, vibe coders building consumer iOS apps  

---

# Part I: Product Strategy & Core Logic

## 1. Executive Summary & Product Philosophy

This product exists to answer a single, high-stakes question for builders:

> “Is this idea worth building — right now?”

Most app intelligence tools focus on dominance: top charts, large incumbents, historical success.  
This product focuses on **emergence**.

It is designed to surface **early momentum**, not popularity — and to translate raw App Store signals into **clear, human-readable conviction**.

The interface should feel less like analytics software and more like **decision infrastructure**: quiet, opinionated, and directional.

- No dashboards for the sake of dashboards.
- No data without interpretation.
- No false precision.

---

## 2. What This Product Is — And Is Not

### 2.1 What This Product *Is*
A web-based platform that:
- Identifies **recently launched and mid-chart iOS apps** showing early traction.
- Ranks opportunities based on **momentum, not size**.
- Translates App Store data into **builder-relevant insights**.
- Helps users decide **what to build — and what to avoid**.

The product outputs **decisions**, not datasets.

### 2.2 What This Product Is *Not*
- Not Sensor Tower.
- Not top-chart analysis.
- Not growth tooling or ad intelligence.
- Not a raw data explorer.
- Not a spreadsheet replacement.

This is **pre-build intelligence**, not post-launch optimization.

---

## 3. Core Product Thesis

Most builders fail for structural reasons, not executional ones.

**Common failure modes:**
- Copying ideas **after markets are saturated**.
- Confusing downloads with opportunity.
- Entering categories where differentiation is already exhausted.

**This product exists to identify:**
- **Early demand**.
- **Unfinished markets**.
- **Unmet user expectations**.

It prioritizes **timing** over scale.

---

## 4. Target User (V1)

### Primary User
- Solo founders, Indie hackers, Vibe coders.
- Builders choosing their *next* consumer iOS app.

### Current Behavior
- Manually browsing the App Store.
- Reading reviews one-by-one.
- Guessing demand.
- Screenshotting competitors.
- Relying on intuition instead of signals.

### Desired Outcome
> “I can confidently decide whether this idea is worth entering — and how I’d win.”

---

## 5. Core Promise

After using the product, a user should be able to say:
- I understand if demand exists **now**.
- I can see early momentum, not hindsight.
- I know what users like and dislike.
- I see clear gaps in existing apps.
- I can make a confident build / no-build decision.

No scraping. No spreadsheets. No overthinking.

---

## 6. First Experience Principle

### Entry Point
- User lands directly on a **web dashboard**.
- No forced onboarding.
- No empty state.

### Immediate Signal
The product must immediately communicate:
> “These iOS apps are gaining traction right now.”

Value must be visible within the first 5 seconds.

---

## 7. Scope & Constraints (V1)

### In Scope
- **Platform:** Web app.
- **Data Source:** iOS App Store only.
- **App Type:** Consumer apps.
- **Focus:** Recent and emerging apps.
- **Time Lens:** Short-term momentum (days to weeks).

### Explicitly Out of Scope (V1)
- Websites.
- Android.
- Enterprise SaaS.
- Growth or ad tooling.
- Long-term historical analysis.

---

## 8. Differentiation Logic

### Rankings Are **Not** Based On
- Total downloads.
- Total revenue.
- Brand dominance.
- Long-term chart position.

### Rankings **Are** Based On
- **Recentness** (7 / 14 / 30 day windows).
- **Momentum** (change over time).
- **User signal quality**.
- **Competitive pressure**.
- **Early monetization signals**.

This creates a **new discovery layer**, orthogonal to existing tools.

---

## 9. Primary Interface: Home Dashboard

The home screen presents **opportunities**, not metrics.

### App Opportunity Card
Each card includes:
- App name + icon.
- Category.
- Days since launch.
- Download estimate.
- Revenue estimate.
- Rating.
- **Gap Score** (single composite value).

### Gap Score Composition
- Demand signals.
- Monetization potential.
- User satisfaction.
- Competitive density.
- Early momentum.

The score is **directional**, not absolute.

### Filtering & Controls
Users can filter by:
- Time window (7 / 14 / 30 days).
- Category.
- Pricing model.
- App type (utility, habit, niche, etc.).

**Design principle:**
> Fewer controls. Strong defaults. Clear direction.

---

## 10. Global Search

A single, fast search surface supporting:
- App names.
- Keywords.
- Problems (“budgeting”, “habits”, “fitness”).
- Categories.

Partial matches are acceptable.

**Design priority:**
> Speed and usefulness over perfect accuracy.

---

## 11. App Detail Page (Decision Surface)

Each app has **one focused page**, optimized for fast judgment.

### 11.1 Overview
- One-sentence description of what the app does.
- Target user.
- Core reason users download it.
- *No marketing copy. No fluff.*

### 11.2 Market Signals
Readable, high-level indicators:
- Directional download trend.
- Revenue estimate.
- Rating and review volume.
- Category rank movement.
- Top geographies.

Exact numbers are secondary. **Trends take priority.**

### 11.3 User Voice (Critical Layer)
Summarized insights from reviews:
- Most common complaints.
- Most praised features.
- Repeated feature requests.

Must be readable in **under 60 seconds**.

### 11.4 Missed Opportunities
A direct answer to:
> “If I built a competitor, what would I do better?”

Includes:
- Missing features.
- UX friction.
- Monetization mistakes.
- Unmet expectations.

This is the **builder insight layer** — not analytics.

### 11.5 Similar Apps
Shows:
- Similar apps list.
- Similarity percentage.
- Key positioning differences.

**Purpose:** Instantly understand **market shape and crowding**.

### 11.6 Pricing Insight
Displays:
- Common pricing models in the category.
- User complaints about pricing.
- Free vs paid friction points.

**Goal:** Enable **smarter pricing decisions**, not blind copying.

---

## 12. Save & Saved

Users can save:
- Apps.
- Categories.
- Searches.

Saved items form a **build saved list** — the tangible output of the product.

---

## 13. Reporting (V1+)

Optional weekly email summary:
- New rising apps.
- Category momentum shifts.

Must be readable in **under 2 minutes**.

---

## 14. Trust, Accuracy & Tone

- All metrics are estimates.
- Direction > precision.
- No false certainty.
- No hype language.

**Tone guideline:**
> “Here’s what the data suggests. Decide wisely.”

---

## 15. Success Definition

The product succeeds if users:
- Spend less time guessing.
- Stop copying saturated ideas.
- Feel confident choosing what to build.
- Build better apps faster.

---

## 16. Structural Rationale for this PRD

This document:
- Defines a **clear wedge** (emergence, not dominance).
- Differentiates cleanly from Sensor Tower.
- Is buildable as a V1.
- Guides both product and design decisions.
- Leaves room for expansion without re-architecture.

---
---

# Part II: Visual Direction & Interface

## 1. Design Philosophy (Non-Negotiable)

This product is not an analytics tool. **It is a judgment surface.**

The interface must feel:
- **Calm**
- **Quiet**
- **Opinionated**
- **Precise**
- **Slightly austere**

If the UI feels exciting, colorful, or “growth-y” — it’s wrong.  
The UI should feel like a **trading terminal for ideas**, not a dashboard for metrics.

---

## 2. Aesthetic North Star

### Visual References (Mental Models)
- **Attio** → Structural clarity, whitespace, restraint.
- **Stripe Docs / Linear** → Calm authority.
- **Financial terminals** → Dense but readable.
- **Apple Settings** → Hierarchy through spacing, not color.

### Avoid:
- Startup gradients.
- SaaS blue.
- Neon highlights.
- Gamified visuals.
- “Cool” animations.

---

## 3. Color System (Monochrome-First)

### Base Palette
- **Background Base:** `#FAFAFA` (off-white, low glare).
- **Surface / Cards:** `#FFFFFF`
- **Primary Text:** `#1A1A1A`
- **Secondary Text:** `#6B6B6B`
- **Muted Text:** `#9A9A9A`
- **Borders:** `rgba(0,0,0,0.08)`

### Accent Usage (Strictly Functional)
Color is used only to signal state, never decoration.
- **Positive / Momentum:** Muted green (low saturation).
- **Negative / Decline:** Muted red or amber.
- **Neutral / Flat:** Grey.

**Rule:** If color doesn’t change a decision, it doesn’t belong.

---

## 4. Typography (Hierarchy Through Spacing)

### Font
- **Primary:** Inter (Variable).

### Usage
- **Page Titles:** Inter 500–600, restrained sizing.
- **Section Labels:** Inter Medium, small caps / uppercase.
- **Body Text:** Inter Regular, generous line height.
- **Metrics:** Tabular numerals enabled.

### Rules
- No massive hero headers.
- No dramatic font scaling.
- Whitespace does the work.

---

## 5. Layout System (Architectural Grid)

### Grid
- **Desktop:** 12-column grid.
- **Tablet:** 8-column.
- **Mobile:** 1-column.

### Containers
- Subtle 1px borders (no heavy shadows).
- Rounded corners (8–12px max).
- Bento-style compartmentalization.
- Information should feel **placed**, not floating.

---

## 6. Core Screens — Visual Direction

### 6.1 Home Dashboard (Opportunity Surface)
**Goal:** Immediate signal, zero explanation.

**Layout:**
- Dense but breathable grid of app cards.
- No hero section.
- No onboarding banners.

**App Card:**
- App icon (small, neutral).
- App name (primary).
- Category (muted).
- Days since launch (quiet but visible).
- **Gap Score** (visual anchor).

**Gap Score Design:**
- Large numeric value.
- Subtle horizontal bar or dot indicator.
- Color only to show direction (up / flat / down).
- *No charts. No sparkline noise.*

### 6.2 Filters & Controls
Filters should feel infrastructural, not playful.
- Inline dropdowns.
- Segmented controls.
- No sliders unless essential.
- **Defaults matter more than flexibility.**

### 6.3 Search
- Single search bar.
- No icons beyond magnifier.
- Results update instantly.
- **Design rule:** Search should feel faster than thinking.

---

## 7. App Detail Page (Decision Page)

**This page is the product.**

### Structure
- Vertical, calm, scannable.
- Each section separated by whitespace, not dividers.

### Sections
1. **Overview Section**
   - Plain text, no icons, no visual noise.
2. **Market Signals**
   - Directional indicators.
   - Minimal charts (thin lines only, no filled areas).
   - Think: trend awareness, not reporting.
3. **User Voice**
   - Bullet-style summaries.
   - No quote walls, emojis, or sentiment meters.
   - Feels like a research note.
4. **Missed Opportunities (Key Section)**
   - Slight background tint.
   - Strong section label.
   - Short, sharp bullets.
   - *This is where conviction forms.*
5. **Similar Apps**
   - Vertical list, comparative reading.
   - Similarity % shown quietly.

---

## 8. Motion & Interaction (Minimal, Purposeful)

### Allowed Motion
- Fade-in on load.
- Subtle hover states.
- Gentle transitions between pages.

### Forbidden Motion
- Bounce.
- Elastic easing.
- Decorative animations.
- Loading spinners that entertain.

**Motion exists to reduce friction, not add delight.**

---

## 9. Icons & Visual Elements
- Thin-stroke icon set only.
- Icons must be secondary to text.
- No illustration systems, mascots, or metaphors.
- **Text > Visuals.**

---

## 10. Dark Mode (Optional)
- True dark (near black).
- Low contrast.
- No neon accents.
- Feels like a terminal, not a gamer UI.

---

## 11. Copy + UI Relationship

### Tone
- **Confident, Neutral, Slightly detached, Analytical.**

### Vocabulary Priorities
- **Avoid:** "Discover", "Unlock", "Boost", "Win".
- **Prefer:** "Indicates", "Suggests", "Shows", "Signals".

---

## 12. Design Success Criteria
The design is correct if:
- A first-time user immediately understands what matters.
- The UI feels trustworthy, not exciting.
- Decisions feel easier, not heavier.
- The product feels like **infrastructure**, not content.
