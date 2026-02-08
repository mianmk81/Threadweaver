"""
Pydantic models matching frontend Zod schemas.
Ensures type safety between frontend and backend.
"""
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator


# ==================== Metrics & State ====================

class MetricsState(BaseModel):
    """Sustainability metrics (all 0-100)"""
    waste: float = Field(ge=0, le=100)
    emissions: float = Field(ge=0, le=100)
    cost: float = Field(ge=0, le=100)
    efficiency: float = Field(ge=0, le=100)
    communityTrust: float = Field(ge=0, le=100, alias="communityTrust")
    sustainabilityScore: float = Field(ge=0, le=100, alias="sustainabilityScore")

    class Config:
        populate_by_name = True


# ==================== Decision Cards ====================

class DecisionOption(BaseModel):
    """Single option within a decision card"""
    id: str
    label: str
    description: str
    deltas: dict[str, float] = Field(
        description="Changes to metrics: waste, emissions, cost, efficiency, communityTrust"
    )
    explanation: str


class DecisionTriggers(BaseModel):
    """Conditions for when a card should appear"""
    waste_min: Optional[float] = None
    waste_max: Optional[float] = None
    emissions_min: Optional[float] = None
    emissions_max: Optional[float] = None
    cost_min: Optional[float] = None
    cost_max: Optional[float] = None
    efficiency_min: Optional[float] = None
    efficiency_max: Optional[float] = None
    trust_min: Optional[float] = None
    trust_max: Optional[float] = None


class DecisionCard(BaseModel):
    """Sustainability decision card"""
    id: str
    title: str
    prompt: str
    tags: List[Literal['waste', 'emissions', 'cost', 'efficiency', 'trust', 'policy']]
    severity: Literal['easy', 'medium', 'hard']
    triggers: Optional[DecisionTriggers] = None
    options: List[DecisionOption] = Field(min_length=2, max_length=3)


# ==================== API Request/Response Models ====================

class GenerateDecisionRequest(BaseModel):
    """Request to generate next decision"""
    currentMetrics: MetricsState
    usedCardIds: List[str] = Field(default_factory=list)
    step: int = Field(ge=0, le=10)
    seed: Optional[int] = None


class ScoringFactor(BaseModel):
    """Why a card was scored highly"""
    factor: str
    score: float
    reason: str


class GenerateDecisionResponse(BaseModel):
    """Response with next decision card"""
    card: DecisionCard
    rationale: str
    scoringDetails: dict = Field(
        description="Details about why this card was chosen"
    )


class ApplyDecisionRequest(BaseModel):
    """Request to apply a decision option"""
    currentMetrics: MetricsState
    cardId: str
    optionId: str


class ApplyDecisionResponse(BaseModel):
    """Response after applying decision"""
    newMetrics: MetricsState
    explanation: str
    businessState: str  # Narrative describing business state after this decision

    class Config:
        populate_by_name = True


class SimulateAutopilotRequest(BaseModel):
    """Request to simulate full autopilot run"""
    initialMetrics: MetricsState
    steps: int = Field(ge=1, le=10)
    startStep: int = Field(default=1, ge=0, le=10, description="Step number to start from (for branched threads)")
    usedCardIds: List[str] = Field(default_factory=list, description="Cards already used in this timeline")
    seed: Optional[int] = None


class TimelineNodeResponse(BaseModel):
    """Single node in autopilot simulation"""
    step: int
    cardId: str
    chosenOptionId: str
    metricsAfter: MetricsState
    explanation: str


class SimulateAutopilotResponse(BaseModel):
    """Response with full autopilot simulation"""
    nodes: List[TimelineNodeResponse]
    finalMetrics: MetricsState


# ==================== Utility Models ====================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    cardsLoaded: int


# ==================== Company Profile Models ====================

class CustomMetrics(BaseModel):
    """Custom metric units for company"""
    wasteUnit: Optional[str] = None
    emissionsUnit: Optional[str] = None
    costCurrency: Optional[str] = None
    operationalScale: Optional[str] = None


class CompanyProfile(BaseModel):
    """Company/organization profile for customization"""
    companyName: str
    industry: str
    size: Literal['small', 'medium', 'large', 'enterprise']
    location: Optional[str] = None
    description: Optional[str] = None
    currentChallenges: Optional[List[str]] = None
    sustainabilityGoals: Optional[List[str]] = None
    customMetrics: Optional[CustomMetrics] = None


class GenerateCustomCardsRequest(BaseModel):
    """Request to generate custom cards based on company profile"""
    companyProfile: CompanyProfile
    numberOfCards: int = Field(default=10, ge=5, le=30)
    focusAreas: Optional[List[str]] = None


class GenerateCustomCardsResponse(BaseModel):
    """Response with generated custom cards"""
    cards: List[DecisionCard]
    customizedMetrics: Dict[str, Any] = Field(
        description="Initial metrics and scaling context"
    )
