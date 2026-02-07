# Threadweaver: Sustainable Futures

A magic-themed, AI-driven sustainability simulator that helps users explore how sustainability decisions compound over time.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)

---

## 🌟 Overview

Threadweaver lets users act as "Chronomancers" who make sustainability decisions and witness their compounding impacts across a 12-month timeline. Users can:

- **Make Decisions**: Choose from AI-generated sustainability scenarios
- **Travel Through Time**: Jump forward 3/6/12 months to see future impacts
- **Rewind & Reweave**: Create alternate timelines by changing past decisions
- **Compare Futures**: View side-by-side comparisons of different timelines
- **Autopilot Mode**: Let AI make optimal decisions automatically

This is **not** a real-world predictor—it's a counterfactual simulation engine for exploring tradeoffs in sustainability policy.

---

## 🎯 Key Features

### 🎨 Dark Cosmic Theme
- Beautiful gradient backgrounds
- Gold and emerald accent colors
- Smooth animations with Framer Motion
- Responsive design (mobile/tablet/desktop)

### 📊 Six Sustainability Metrics
- **Waste** (0-100, lower is better)
- **Emissions** (0-100, lower is better)
- **Cost** (0-100, lower is better)
- **Efficiency** (0-100, higher is better)
- **Community Trust** (0-100, higher is better)
- **Sustainability Score** (aggregate, 0-100)

### 🧠 AI Decision Engine
- Trigger-based card selection
- Urgency scoring algorithm
- Weighted objective optimization for autopilot
- Explainable recommendations

### ⏰ Time Travel Mechanics
- **Jump**: Fast-forward to 3/6/12 months
- **Rewind**: Go back to any previous step
- **Reweave**: Create branching alternate timelines

### ♿ Accessibility
- Full keyboard navigation
- ARIA labels on all interactive elements
- Screen reader support
- Responsive design

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (for backend)

### Installation

1. **Install frontend dependencies**:
```bash
npm install
```

2. **Install backend dependencies**:
```bash
cd api
pip install -r requirements.txt
cd ..
```

### Running the Application

**Terminal 1 - Frontend** (Next.js):
```bash
npm run dev
```
Access at: http://localhost:3000

**Terminal 2 - Backend** (FastAPI):
```bash
cd api
python -m uvicorn main:app --reload
```
API at: http://localhost:8000

### First Steps

1. Visit http://localhost:3000/loom
2. Click "Make Next Decision"
3. Choose an option and see metrics change
4. Use Jump buttons to fast-forward
5. Try Reweave to create alternate timelines!

---

## 🏗️ Project Structure

```
threadweaver/
├── app/                      # Next.js App Router
│   ├── loom/page.tsx         # Main Loom interface
│   ├── globals.css           # Cosmic theme styles
│   └── layout.tsx            # Root layout
│
├── components/               # React components
│   ├── loom/                 # Core visualization
│   │   ├── LoomCanvas.tsx    # SVG timeline
│   │   ├── ThreadPanel.tsx   # Timeline switcher
│   │   └── ImpactPanel.tsx   # Metrics dashboard
│   └── ui/                   # Reusable UI
│       ├── DecisionModal.tsx # Decision selection
│       ├── ChronosControls.tsx # Time travel controls
│       ├── CompareView.tsx   # Timeline comparison
│       ├── ErrorBoundary.tsx # Error handling
│       └── Toast.tsx         # Notifications
│
├── lib/                      # Core logic
│   ├── types.ts              # TypeScript + Zod schemas
│   ├── store/                # Zustand state
│   ├── hooks/                # Custom hooks
│   └── utils/                # Utilities
│
├── data/cards.json           # 23 decision cards
│
└── api/                      # FastAPI backend
    ├── main.py               # FastAPI app
    ├── schemas/models.py     # Pydantic models
    └── engine/               # Decision engine
        ├── cards.py
        ├── scoring.py
        └── simulate.py
```

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open decision modal |
| `Cmd/Ctrl + Shift + C` | Compare timelines |
| `Cmd/Ctrl + Shift + A` | Toggle autopilot |
| `Arrow Left/Right` | Navigate steps |
| `1`, `2`, `3` | Quick jump to 3mo/6mo/12mo |
| `Escape` | Close modals |

---

## 🧪 Tech Stack

**Frontend:**
- Next.js 16.1 + TypeScript
- TailwindCSS 4.0
- Zustand (state)
- Framer Motion (animations)
- Zod (validation)

**Backend:**
- FastAPI 0.115
- Pydantic 2.10
- Python 3.10+

---

## 📚 Documentation

- **[API Reference](API.md)**: Complete backend API docs
- **[CLAUDE.md](CLAUDE.md)**: Architecture guide
- **[PROJECT_PROGRESS.txt](PROJECT_PROGRESS.txt)**: Progress tracker

---

## 🚢 Deployment

**Frontend (Vercel)**:
1. Push to GitHub
2. Connect to Vercel
3. Deploy!

**Backend (Render)**:
- Build: `pip install -r api/requirements.txt`
- Start: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

---

## 📄 License

MIT License

---

**Made with ✨ by the Threadweaver Team**
