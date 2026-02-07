# Threadweaver API Documentation

Complete API reference for the Threadweaver backend.

## Base URL

```
Development: http://localhost:8000
Production: https://api.threadweaver.app
```

## Authentication

Currently no authentication required. Future versions may implement API keys or OAuth.

---

## Endpoints

### Health Check

**GET** `/health`

Check API health and status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "cardsLoaded": 22
}
```

**Status Codes:**
- `200 OK`: API is healthy
- `500 Internal Server Error`: API is down

---

### Generate Decision

**POST** `/api/generate-decision`

Get the next decision card based on current state.

**Request Body:**
```json
{
  "currentMetrics": {
    "waste": 50,
    "emissions": 50,
    "cost": 50,
    "efficiency": 50,
    "communityTrust": 50,
    "sustainabilityScore": 50
  },
  "usedCardIds": ["packaging-policy", "supplier-local"],
  "step": 1,
  "seed": 42  // Optional: for deterministic results
}
```

**Response:**
```json
{
  "card": {
    "id": "equipment-upgrade",
    "title": "Energy-Efficient Equipment Investment",
    "prompt": "Your kitchen equipment is outdated and inefficient. Consider upgrades.",
    "tags": ["emissions", "efficiency", "cost"],
    "severity": "hard",
    "triggers": {
      "efficiency_max": 50.0
    },
    "options": [
      {
        "id": "full-upgrade",
        "label": "Replace all major equipment with Energy Star models",
        "description": "Maximum efficiency, high upfront cost",
        "deltas": {
          "waste": -2.0,
          "emissions": -20.0,
          "cost": 25.0,
          "efficiency": 18.0,
          "communityTrust": 8.0
        },
        "explanation": "New equipment dramatically reduces energy use but requires significant capital."
      }
      // ... more options
    ]
  },
  "rationale": "This card was chosen because: High-impact decision (This is a hard decision with significant long-term effects)",
  "scoringDetails": {
    "finalScore": 110.0,
    "topFactors": [
      {
        "factor": "High-impact decision",
        "score": 110.0,
        "reason": "This is a hard decision with significant long-term effects"
      }
    ],
    "candidatesConsidered": 3,
    "totalEligible": 14
  }
}
```

**Status Codes:**
- `200 OK`: Decision generated successfully
- `404 Not Found`: No eligible cards available
- `422 Unprocessable Entity`: Invalid request data

**Notes:**
- Cards are filtered based on triggers (e.g., `efficiency_max: 50` means card only appears if efficiency ≤ 50)
- AI scoring algorithm prioritizes urgent problems (high waste, low efficiency)
- Seed parameter ensures reproducible results for testing

---

### Apply Decision

**POST** `/api/apply-decision`

Apply a chosen decision option to current metrics.

**Request Body:**
```json
{
  "currentMetrics": {
    "waste": 50,
    "emissions": 50,
    "cost": 50,
    "efficiency": 50,
    "communityTrust": 50,
    "sustainabilityScore": 50
  },
  "cardId": "equipment-upgrade",
  "optionId": "phased-replacement"
}
```

**Response:**
```json
{
  "newMetrics": {
    "waste": 49.0,
    "emissions": 38.0,
    "cost": 62.0,
    "efficiency": 60.0,
    "communityTrust": 55.0,
    "sustainabilityScore": 54.2
  },
  "explanation": "Gradual approach spreads costs while delivering improvements."
}
```

**Status Codes:**
- `200 OK`: Decision applied successfully
- `404 Not Found`: Card or option not found
- `422 Unprocessable Entity`: Invalid request data

**Notes:**
- Deltas are applied to base metrics
- All metrics clamped to 0-100 range
- Sustainability score automatically recalculated

**Sustainability Score Formula:**
```
sustainabilityScore = (
  (100 - waste) * 0.25 +
  (100 - emissions) * 0.25 +
  (100 - cost) * 0.15 +
  efficiency * 0.20 +
  communityTrust * 0.15
)
```

---

### Simulate Autopilot

**POST** `/api/simulate-autopilot`

Run a full autopilot simulation with AI selecting best options.

**Request Body:**
```json
{
  "initialMetrics": {
    "waste": 50,
    "emissions": 50,
    "cost": 50,
    "efficiency": 50,
    "communityTrust": 50,
    "sustainabilityScore": 50
  },
  "steps": 5,
  "seed": 42  // Optional: for deterministic results
}
```

**Response:**
```json
{
  "nodes": [
    {
      "step": 1,
      "cardId": "supplier-local",
      "chosenOptionId": "negotiate-bulk",
      "metricsAfter": {
        "waste": 50.0,
        "emissions": 45.0,
        "cost": 48.0,
        "efficiency": 53.0,
        "communityTrust": 52.0,
        "sustainabilityScore": 52.45
      },
      "explanation": "Selected 'Negotiate greener shipping with bulk supplier': +2.4 sustainability score, -5 emissions reduction, +3 efficiency gain, +2 community trust"
    }
    // ... more nodes
  ],
  "finalMetrics": {
    "waste": 32.0,
    "emissions": 17.0,
    "cost": 64.0,
    "efficiency": 91.0,
    "communityTrust": 67.0,
    "sustainabilityScore": 71.4
  }
}
```

**Status Codes:**
- `200 OK`: Simulation completed successfully
- `404 Not Found`: No eligible cards for simulation
- `422 Unprocessable Entity`: Invalid request data
- `500 Internal Server Error`: Simulation failed

**Autopilot Algorithm:**
The autopilot uses a weighted objective function to select the best option:

```python
objective_score = (
  score_gain * 5.0 +        # Prioritize sustainability score
  cost_penalty +             # Penalize cost increases > 10
  trust_penalty +            # Penalize trust drops > -5
  efficiency_bonus * 1.5     # Reward efficiency gains
)
```

**Notes:**
- Autopilot always picks the option with highest objective score
- Uses same card selection algorithm as manual play
- Each step builds on previous step's metrics
- Maximum 10 steps (12 months simulation)

---

## Decision Card Structure

### Triggers

Cards can specify when they should appear:

```json
{
  "triggers": {
    "waste_min": 60,      // Show if waste >= 60
    "waste_max": 90,      // Show if waste <= 90
    "emissions_min": 50,
    "emissions_max": 80,
    "cost_min": 40,
    "cost_max": 70,
    "efficiency_min": 20,
    "efficiency_max": 50,
    "trust_min": 30,
    "trust_max": 60
  }
}
```

All specified conditions must be met (AND logic).

### Tags

Available tags:
- `waste`: Waste management
- `emissions`: Carbon/energy emissions
- `cost`: Financial considerations
- `efficiency`: Operational efficiency
- `trust`: Community relations
- `policy`: Policy/regulatory

### Severity Levels

- `easy`: Low-impact decisions (1.0x score multiplier)
- `medium`: Moderate-impact (1.5x score multiplier)
- `hard`: High-impact decisions (2.0x score multiplier)

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

Common errors:
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Request validation failed
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently no rate limiting. Future versions may implement:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## CORS

Allowed origins:
- `http://localhost:3000` (development)
- `http://localhost:3001`
- `https://threadweaver.vercel.app` (production)

---

## Testing

### cURL Examples

**Health check:**
```bash
curl http://localhost:8000/health
```

**Generate decision:**
```bash
curl -X POST http://localhost:8000/api/generate-decision \
  -H "Content-Type: application/json" \
  -d '{
    "currentMetrics": {
      "waste": 50, "emissions": 50, "cost": 50,
      "efficiency": 50, "communityTrust": 50, "sustainabilityScore": 50
    },
    "usedCardIds": [],
    "step": 1
  }'
```

**Apply decision:**
```bash
curl -X POST http://localhost:8000/api/apply-decision \
  -H "Content-Type: application/json" \
  -d '{
    "currentMetrics": {
      "waste": 50, "emissions": 50, "cost": 50,
      "efficiency": 50, "communityTrust": 50, "sustainabilityScore": 50
    },
    "cardId": "packaging-policy",
    "optionId": "compostable"
  }'
```

**Simulate autopilot:**
```bash
curl -X POST http://localhost:8000/api/simulate-autopilot \
  -H "Content-Type: application/json" \
  -d '{
    "initialMetrics": {
      "waste": 50, "emissions": 50, "cost": 50,
      "efficiency": 50, "communityTrust": 50, "sustainabilityScore": 50
    },
    "steps": 5,
    "seed": 42
  }'
```

---

## Interactive Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:
- View all endpoints
- Test API calls directly in the browser
- See request/response schemas
- Download OpenAPI specification

---

## SDK / Client Libraries

### JavaScript/TypeScript

Use the provided API client:

```typescript
import { generateDecision, applyDecision, simulateAutopilot } from '@/lib/utils/api';

// Generate next decision
const { card, rationale } = await generateDecision({
  currentMetrics,
  usedCardIds,
  step: 1,
});

// Apply chosen option
const { newMetrics, explanation } = await applyDecision({
  currentMetrics,
  cardId: card.id,
  optionId: selectedOptionId,
});

// Run autopilot
const { nodes, finalMetrics } = await simulateAutopilot({
  initialMetrics,
  steps: 10,
  seed: 42,
});
```

---

## Versioning

Current version: **1.0.0**

API versioning will be introduced in future releases (e.g., `/v2/api/generate-decision`).

---

## Support

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/threadweaver/issues)
- **Documentation**: [Full docs](https://threadweaver.app/docs)
- **Email**: support@threadweaver.app
