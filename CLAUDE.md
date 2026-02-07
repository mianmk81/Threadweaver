# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Threadweaver: Sustainable Futures** is a magic-themed, AI-driven sustainability simulator that helps users explore how sustainability decisions compound over time. Users act as "Chronomancers" who can:
- Make sustainability decisions across 6 metrics (Waste, Emissions, Cost, Efficiency, Community Trust, Sustainability Score)
- Jump forward in time (3/6/12 months = steps 3/6/10)
- Rewind and "reweave" alternate timelines to compare outcomes
- See explainable AI-generated decisions based on current state

This is **NOT** a real-world predictor—it's a counterfactual simulation engine for exploring tradeoffs in sustainability policy.

## Architecture

### Frontend (Next.js 14+ App Router + TypeScript)

**Core Concept**: The "Loom" is a visual timeline where:
- **Threads** = alternate timelines (Thread A baseline, Thread B rewoven)
- **Nodes** = decision points (10 total = 12 months)
- **Runes** = decisions that alter the fabric of time
- Users can branch at any node to create alternate futures

**Key Files**:
- ✅ `lib/types.ts` - Complete type system with Zod schemas (MetricsState, DecisionCard, TimelineThread, SessionState)
- ✅ `lib/store/useThreadweaverStore.ts` - Zustand state management with LocalStorage persistence
- ✅ `lib/hooks/useKeyboardShortcuts.ts` - Keyboard navigation (Cmd/Ctrl+K, arrows, etc.)
- ✅ `data/cards.json` - 22 sustainability decision cards with triggers and multi-option choices
- ✅ `app/page.tsx` - Landing page with cosmic theme and "Enter the Loom" CTA
- ✅ `app/loom/page.tsx` - Main Loom interface orchestrating all components
- ✅ `app/globals.css` - Tailwind v4 CSS with CSS custom properties for cosmic theme
- ✅ `tailwind.config.ts` - Custom theme config (cosmic colors, animations)
- ✅ `components/loom/` - LoomCanvas (SVG timeline), ThreadPanel, ImpactPanel
- ✅ `components/ui/` - DecisionModal, ChronosControls, CompareView, ErrorBoundary, Toast
- ✅ `api/` - FastAPI backend with decision engine (cards.py, scoring.py, simulate.py)

**State Management Philosophy**:
- Zustand manages global state (threads, active thread, current step, autopilot mode)
- Each thread contains 0-10 nodes (decision history)
- Threads are immutable—rewinding creates a new thread with shared prefix
- LocalStorage persists sessions between visits

**Rendering Strategy**:
- Server Components for layout and initial data
- Client Components for interactive Loom (SVG animations, state updates)
- SWR for API calls to backend decision engine

### Backend (FastAPI - in `api/` directory)

**Decision Engine Architecture**:
- `api/engine/scoring.py` - Card selection logic based on triggers and current metrics
- `api/engine/simulate.py` - Autopilot simulation (AI picks best options)
- `api/engine/cards.py` - Card library management
- `api/schemas/models.py` - Pydantic models matching frontend Zod schemas

**Decision Selection Algorithm**:
1. Filter cards by triggers (e.g., `waste > 70` → show waste-reduction cards)
2. Score cards based on metric urgency and card tags
3. Add deterministic randomness (seeded RNG for reproducibility)
4. Return card + explanation of why it was chosen

**Autopilot Logic**:
- Maximize Sustainability Score
- Penalize cost spikes and trust drops
- Use weighted objective function to pick best option per card

### Data Model

**Metrics** (0-100 scale):
- Lower is better: Waste, Emissions, Cost
- Higher is better: Efficiency, Community Trust, Sustainability Score

**Decision Cards** contain:
- `triggers`: State conditions that make this card eligible (e.g., `waste_min: 60`)
- `tags`: Categories like 'waste', 'emissions', 'policy'
- `options` (2-3): Each has deltas for all 5 base metrics + explanation
- `severity`: 'easy'/'medium'/'hard' (affects visual weight)

**Timeline Structure**:
```
Thread {
  id, label, color, createdAt
  nodes: [
    {
      id, step, timestamp, cardId, chosenOptionId,
      metricsAfter, explanation, businessState
    }
  ]
  parentThreadId?, branchPoint?
}
```

**Branch Visualization**:
- Threads visually diverge from their `branchPoint` on the canvas
- Only unique nodes (after branchPoint) are rendered for child threads
- Dotted connectors show where branches split from parent timelines
- Click any timeline path or node to switch active thread

## Development Commands

### Initial Setup
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd api
pip install -r requirements.txt
cd ..
```

### Running the Application
**Frontend (Next.js)**:
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
```

**Backend (FastAPI)** - Run in separate terminal:
```bash
cd api
python -m uvicorn main:app --reload        # Default port 8000
python -m uvicorn main:app --reload --port 8001  # Custom port if 8000 in use
```

**Environment Configuration**:
- Frontend API URL is configured in `.env.local` (create if doesn't exist)
- Set `NEXT_PUBLIC_API_URL=http://localhost:8001` to point to backend

### Build & Production
```bash
npm run build            # Production build with optimizations
npm start                # Serve production build
npm run lint             # Run ESLint on codebase
```

## Key Implementation Details

### Type Safety
- All types defined in `lib/types.ts` with Zod schemas
- Runtime validation on API boundaries
- Zod schemas exported for both frontend and backend use
- `MetricsState`, `DecisionCard`, `TimelineThread`, `SessionState` are core types

### Sustainability Score Calculation
The aggregate score is computed from the 5 base metrics:
```
sustainabilityScore = (
  (100 - waste) * 0.25 +
  (100 - emissions) * 0.25 +
  (100 - cost) * 0.15 +
  efficiency * 0.20 +
  communityTrust * 0.15
)
```

### Time Travel Mechanics
- **Jump**: Move cursor to step 3/6/10 using quick buttons or slider
- **Rewind**: Click prior node to view decision details
- **Reweave**: Click "Reweave from Here" in NodeDetailsModal to create alternate timeline branch
- **Autopilot**: Simulates all remaining decisions automatically using AI
- **Node Details**: Click any node to see decision card, all options, chosen option (highlighted), metrics impact, and business narrative
- Threads diverge visually in the Loom (Git-style branch diagram)

### Explainability
Every decision includes:
- **Rationale**: Why this card was chosen (top 2-3 scoring factors)
- **Option explanations**: What each choice means
- **Oracle Summary**: Natural language summary of changes after each step

## UI/UX Patterns

### Dark Cosmic Theme (Tailwind v4)
- **IMPORTANT**: Using Tailwind CSS v4 with breaking changes from v3
- Colors defined as CSS custom properties in `app/globals.css` (not in `tailwind.config.ts`)
- Background: Slate-950 with radial gradient (#1a1a2e → #0a0a0f → #05050a)
- Primary: Gold (#FFD700) - represents "woven threads"
- Secondary: Emerald (#10B981) - represents "growth/sustainability"
- Animations: Glow effects, floating particles, thread weaving
- **DO NOT use `@apply` directives** - use vanilla CSS instead
- **DO NOT use `theme()` function** - use CSS variables like `var(--color-gold)` instead

### Component Hierarchy
```
app/page.tsx (Landing)
  → "Enter the Loom" CTA with cosmic animation

app/loom/page.tsx (Main App)
  ├─ LoomCanvas (center - 75% width)
  │   ├─ Multi-branch SVG visualization (all threads on one canvas)
  │   ├─ Active thread: 100% opacity, others: 30% opacity
  │   ├─ Branch connectors showing divergence points
  │   ├─ Pan & zoom controls (drag to pan, scroll to zoom)
  │   └─ Click any branch to switch active thread
  ├─ ImpactPanel (right - 25% width)
  │   ├─ Current Impact (6 metric bars)
  │   ├─ Business State Card (narrative)
  │   └─ Oracle's Wisdom
  └─ ChronosControls (bottom)
      └─ Jump/Rewind/Autopilot/Time slider
```

### Accessibility & Keyboard Shortcuts
- Full keyboard navigation for all controls (see `lib/hooks/useKeyboardShortcuts.ts`)
- `Cmd/Ctrl + K` - Open decision modal
- `Cmd/Ctrl + Shift + C` - Compare timelines
- `Cmd/Ctrl + Shift + A` - Toggle autopilot
- `Arrow Left/Right` - Navigate steps
- `1`, `2`, `3` - Quick jump to 3mo/6mo/12mo
- `Escape` - Close modals
- ARIA labels on interactive elements
- Screen reader-friendly descriptions

## Adding New Decision Cards

Create cards in `data/cards.json`:
```json
{
  "id": "unique-slug",
  "title": "Card Title",
  "prompt": "What should you do about X?",
  "tags": ["waste", "policy"],
  "severity": "medium",
  "triggers": {
    "waste_min": 60,  // Only show if waste >= 60
    "trust_max": 40   // AND trust <= 40
  },
  "options": [
    {
      "id": "option-1",
      "label": "Option A",
      "description": "Do this thing",
      "deltas": {
        "waste": -10,      // Reduces waste
        "emissions": 5,    // Increases emissions
        "cost": -5,        // Reduces cost
        "efficiency": 0,   // No change
        "communityTrust": 10
      },
      "explanation": "This works because..."
    }
  ]
}
```

**Card Design Guidelines**:
- Make tradeoffs clear (no "win-win" options—force hard choices)
- Deltas typically range -20 to +20
- Use triggers to create narrative arcs (low trust → outreach events)
- Severity affects visual weight in UI

## FastAPI Backend Structure

### API Endpoints
The backend is fully implemented with these endpoints:

- `GET /health` - Health check (returns status, version, cardsLoaded count)
- `GET /api/cards/{card_id}` - Retrieve a specific decision card by ID
- `POST /api/generate-decision` - Get next decision card based on current metrics
- `POST /api/apply-decision` - Apply a decision and get updated metrics + business narrative
- `POST /api/simulate-autopilot` - Run autopilot simulation for N steps

### Module Structure
```
api/
├── main.py                    # FastAPI app, CORS, routes
├── requirements.txt           # fastapi, uvicorn, pydantic, python-multipart
├── schemas/
│   ├── __init__.py           # Export all schemas (use relative imports!)
│   └── models.py             # Pydantic models matching frontend Zod schemas
└── engine/
    ├── __init__.py           # Export cards, scoring, simulate
    ├── cards.py              # Card loading from ../data/cards.json
    ├── scoring.py            # Decision selection algorithm
    └── simulate.py           # Autopilot simulation logic
```

### Import Pattern (CRITICAL)
Backend uses **relative imports** in `__init__.py` files:
```python
# api/schemas/__init__.py
from .models import (  # Correct: relative import
    MetricsState,
    DecisionCard,
    # ...
)

# NOT: from api.schemas.models import ... (will fail!)
```

### Running Backend on Custom Port
If port 8000 is in use, run on different port and update frontend `.env.local`:
```bash
# Backend
python -m uvicorn main:app --reload --port 8001

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Tech Stack

**Frontend**:
- Next.js 16.1 with App Router (React 19.2)
- TypeScript 5.0
- Tailwind CSS 4.0 (v4 breaking changes - see UI/UX section)
- Zustand 5.0 (state management with LocalStorage persistence)
- Framer Motion 12.33 (animations)
- Recharts 3.7 (metric visualizations)
- SWR 2.4 (API data fetching)
- Zod 4.3 (runtime validation)
- Lucide React (icons)

**Backend**:
- FastAPI 0.115.6
- Pydantic 2.10.5 (data validation)
- Uvicorn 0.34.0 (ASGI server)
- Python 3.10+

## Common Issues & Solutions

### Tailwind v4 CSS Errors
**Problem**: `Cannot apply unknown utility class` or `Could not resolve theme function`
**Solution**: Tailwind v4 removed `@apply` and `theme()` functions. Use vanilla CSS with CSS custom properties:
```css
/* ❌ DON'T (Tailwind v3 syntax) */
.btn { @apply bg-gold text-cosmic-dark; }
border: 2px solid theme('colors.cosmic.darker');

/* ✅ DO (Tailwind v4 syntax) */
.btn {
  background-color: var(--color-gold);
  color: var(--color-cosmic-dark);
}
border: 2px solid var(--color-cosmic-darker);
```

### Backend Import Errors
**Problem**: `ModuleNotFoundError: No module named 'api'`
**Solution**: Use relative imports in `__init__.py` files:
```python
# ✅ Correct
from .models import MetricsState

# ❌ Wrong
from api.schemas.models import MetricsState
```

### Port Conflicts
**Problem**: Backend fails with "Address already in use"
**Solution**: Use different port and update frontend config:
```bash
# Backend
cd api
python -m uvicorn main:app --reload --port 8001

# Frontend - create/edit .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
npm run dev  # Restart to pick up new env var
```

### Next.js Lock File Issues
**Problem**: "Unable to acquire lock at .next/dev/lock"
**Solution**: Kill existing Next.js process:
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                 # Mac/Linux

# Kill the process
taskkill //F //PID <PID>      # Windows
kill -9 <PID>                 # Mac/Linux

# Remove lock file
rm -f .next/dev/lock
npm run dev
```

### Python Cache Issues
**Problem**: Backend not reflecting code changes (e.g., new Pydantic fields)
**Solution**: Clear Python cache and restart without auto-reload:
```bash
# Clear __pycache__ directories
find . -type d -name "__pycache__" -exec rm -rf {} +  # Mac/Linux
# Windows: manually delete __pycache__ folders or use Git Bash

# Restart backend fresh
cd api
python -m uvicorn main:app --port 8003  # No --reload flag
```

### Frontend Not Fetching Static Files
**Problem**: Trying to `fetch('/data/cards.json')` returns 404 or HTML
**Solution**: Next.js can't serve files outside `public/`. Use backend API instead:
```typescript
// ❌ Wrong - won't work in Next.js
fetch('/data/cards.json')

// ✅ Correct - use backend endpoint
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
fetch(`${apiUrl}/api/cards/${cardId}`)
```

## Production Deployment

**Frontend**: Vercel (optimized for Next.js App Router)
**Backend**: Render, Fly.io, or AWS Lambda (FastAPI with Mangum)
**Database** (future): PostgreSQL for saved sessions, Supabase for auth

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.threadweaver.app
BACKEND_CORS_ORIGINS=https://threadweaver.app
```

## Key Features Implemented

### Multi-Branch Timeline Visualization (LoomCanvas)
- All timeline threads rendered on single SVG canvas (no sidebar switching)
- Active thread: 100% opacity, inactive: 30% opacity
- Branches visually split from exact divergence point (not from beginning)
- Dotted connectors show parent-child relationships
- Pan (drag) and zoom (scroll) controls for navigation
- Double-click or reset button to restore default view

### Node Interaction System
- **Click completed nodes**: Opens NodeDetailsModal showing full decision history
- **NodeDetailsModal displays**:
  - Decision card title and prompt
  - All available options (chosen one highlighted in gold with checkmark)
  - Metrics before/after comparison with delta indicators
  - Business state narrative at that point in time
  - "Reweave from Here" button to create alternate timeline

### Autopilot Simulation
- Click "Autopilot" button to AI-simulate all remaining decisions
- Runs `/api/simulate-autopilot` to get optimal path
- Populates entire timeline at once (10 steps total)
- Shows success message explaining interaction options
- Timeline remains fully interactive after completion

### Thread Management
- Create new threads via "Reweave New Thread" button
- Delete threads (except last one) via hover trash icon with confirmation
- Threads branched from nodes copy parent history up to branch point
- Switch active thread by clicking any timeline path

### Business Narrative System
- Each decision generates contextual business narrative
- `generate_business_state_narrative()` in backend creates dynamic stories
- Narratives based on sustainability score thresholds and metric states
- Displayed in BusinessStateCard component between metrics and oracle

## Development Philosophy

**Time is a Fabric**: Every feature should reinforce the "weaving threads" metaphor. Rewinding isn't "undo"—it's creating a new timeline branch.

**Explainability First**: Users should never see an unexplained outcome. Every decision and metric change includes clear reasoning.

**Tradeoffs Matter**: Avoid "correct answers." Show that all sustainability choices have costs—educational value comes from comparing outcomes.

**Performance**: Loom rendering must be smooth. SVG animations should not block interactions. Cache simulation results aggressively.
