"""
FastAPI backend for Threadweaver: Sustainable Futures.
Provides AI-driven decision generation and autopilot simulation.
"""
from typing import List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import fitz  # PyMuPDF

from schemas.models import (
    GenerateDecisionRequest,
    GenerateDecisionResponse,
    ApplyDecisionRequest,
    ApplyDecisionResponse,
    SimulateAutopilotRequest,
    SimulateAutopilotResponse,
    TimelineNodeResponse,
    HealthResponse,
    DecisionCard,
    MetricsState,
    GenerateCustomCardsRequest,
    GenerateCustomCardsResponse,
)
from engine import cards, scoring, simulate, gemini, impact_tracker


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, cleanup on shutdown."""
    # Startup: Validate cards
    is_valid, errors = cards.validate_cards()
    if not is_valid:
        print("WARNING: Card validation warnings:")
        for error in errors:
            print(f"   - {error}")
    else:
        print(f"SUCCESS: Loaded {cards.get_card_count()} decision cards successfully")

    yield  # App runs here

    # Shutdown: Clear cache
    cards.clear_cache()
    print("CLEANUP: Cache cleared")


# Initialize FastAPI app
app = FastAPI(
    title="Threadweaver API",
    description="AI-driven sustainability simulation engine",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS configuration: allow localhost and 127.0.0.1 on any port (dev) + production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://threadweaver.vercel.app",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ==================== Health Check ====================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        cardsLoaded=cards.get_card_count()
    )


# ==================== Decision Generation ====================

@app.post("/api/generate-decision", response_model=GenerateDecisionResponse)
async def generate_decision(request: GenerateDecisionRequest):
    """
    Generate next decision card based on current state.

    Uses AI scoring algorithm to:
    1. Filter cards by triggers
    2. Score based on metric urgency
    3. Return top card with rationale

    Args:
        request: Current metrics, used card IDs, step, optional seed

    Returns:
        Next decision card with explanation

    Raises:
        HTTPException: If no eligible cards found
    """
    # Convert Pydantic models to dicts for engine
    metrics_dict = request.currentMetrics.model_dump(by_alias=True)

    # Select card using HYBRID AI SYSTEM (algorithm + ESG-BERT + Gemini)
    # Set use_ai=True to enable multi-model AI enhancement
    card_dict, rationale, scoring_details = scoring.select_card_with_ai(
        metrics=metrics_dict,
        used_card_ids=request.usedCardIds,
        seed=request.seed,
        use_ai=True  # Enable AI enhancement
    )

    if not card_dict:
        raise HTTPException(
            status_code=404,
            detail="No eligible cards available. All cards may have been used or no cards match current triggers."
        )

    # Convert to Pydantic model
    card = DecisionCard(**card_dict)

    return GenerateDecisionResponse(
        card=card,
        rationale=rationale,
        scoringDetails=scoring_details
    )


# ==================== Apply Decision ====================

def generate_business_state_narrative(card: dict, option: dict, new_metrics: dict) -> str:
    """
    Generate a narrative describing the business state after a decision.

    Args:
        card: The decision card
        option: The chosen option
        new_metrics: Metrics after applying the decision

    Returns:
        A narrative string describing the current business state
    """
    # Extract key metrics
    waste = new_metrics["waste"]
    emissions = new_metrics["emissions"]
    cost = new_metrics["cost"]
    efficiency = new_metrics["efficiency"]
    trust = new_metrics["communityTrust"]
    score = new_metrics["sustainabilityScore"]

    # Determine business state based on metrics and decision context
    narratives = []

    # Overall assessment based on sustainability score
    if score >= 70:
        narratives.append("Your campus dining operation is now a sustainability leader, setting the standard for institutional food service.")
    elif score >= 50:
        narratives.append("The dining operation is making solid progress on sustainability, with measurable improvements across key areas.")
    elif score >= 30:
        narratives.append("Sustainability efforts are underway, though challenges remain in balancing environmental and operational goals.")
    else:
        narratives.append("The dining operation faces significant sustainability challenges that require strategic attention.")

    # Waste management state
    if waste <= 30:
        narratives.append("Food waste has been dramatically reduced through smart sourcing and composting programs.")
    elif waste >= 70:
        narratives.append("Food waste remains a persistent challenge, with significant amounts going to landfills daily.")

    # Emissions state
    if emissions <= 30:
        narratives.append("Carbon emissions have dropped thanks to local sourcing and energy-efficient equipment.")
    elif emissions >= 70:
        narratives.append("The carbon footprint remains high, driven by energy-intensive operations and supply chain choices.")

    # Financial state
    if cost <= 30:
        narratives.append("Cost controls are working well, freeing up budget for further sustainability investments.")
    elif cost >= 70:
        narratives.append("Operating costs have risen, putting pressure on the budget and limiting future initiatives.")

    # Operational state
    if efficiency >= 70:
        narratives.append("Operations run smoothly with optimized processes and well-trained staff.")
    elif efficiency <= 30:
        narratives.append("Operational inefficiencies are creating bottlenecks and staff frustration.")

    # Stakeholder relations
    if trust >= 70:
        narratives.append("Student satisfaction is high, with strong community support for sustainability initiatives.")
    elif trust <= 30:
        narratives.append("Stakeholder trust is low, with concerns about transparency and commitment to change.")

    # Add context from the decision
    decision_context = f"Your recent decision to {option['label'].lower()} has reshaped operations."
    narratives.insert(1, decision_context)

    return " ".join(narratives)


@app.post("/api/apply-decision", response_model=ApplyDecisionResponse)
async def apply_decision(request: ApplyDecisionRequest):
    """
    Apply a chosen decision option to current metrics.

    Args:
        request: Current metrics, card ID, chosen option ID

    Returns:
        New metrics after applying deltas + explanation + business state narrative

    Raises:
        HTTPException: If card or option not found
    """
    # Find the card
    card = cards.get_card_by_id(request.cardId)
    if not card:
        raise HTTPException(status_code=404, detail=f"Card '{request.cardId}' not found")

    # Find the option
    option = next((opt for opt in card["options"] if opt["id"] == request.optionId), None)
    if not option:
        raise HTTPException(status_code=404, detail=f"Option '{request.optionId}' not found in card '{request.cardId}'")

    # Apply deltas
    metrics_dict = request.currentMetrics.model_dump(by_alias=True)
    new_metrics_dict = simulate.apply_deltas(metrics_dict, option["deltas"])

    # Convert to Pydantic model
    new_metrics = MetricsState(**new_metrics_dict)

    # Generate business state narrative
    business_state = generate_business_state_narrative(card, option, new_metrics_dict)

    return ApplyDecisionResponse(
        newMetrics=new_metrics,
        explanation=option["explanation"],
        businessState=business_state
    )


# ==================== Autopilot Simulation ====================

@app.post("/api/simulate-autopilot", response_model=SimulateAutopilotResponse)
async def simulate_autopilot(request: SimulateAutopilotRequest):
    """
    Run full autopilot simulation.

    Automatically selects best options for N steps and returns full timeline.

    Args:
        request: Initial metrics, number of steps, optional seed

    Returns:
        List of timeline nodes with final metrics

    Raises:
        HTTPException: If simulation fails
    """
    # Convert to dict
    initial_metrics_dict = request.initialMetrics.model_dump(by_alias=True)

    # Run simulation
    try:
        nodes_data = simulate.simulate_full_run(
            initial_metrics=initial_metrics_dict,
            steps=request.steps,
            start_step=request.startStep,
            used_card_ids=request.usedCardIds,
            seed=request.seed
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

    if not nodes_data:
        raise HTTPException(status_code=404, detail="No eligible cards for simulation")

    # Convert to Pydantic models
    nodes = []
    for node_data in nodes_data:
        node = TimelineNodeResponse(
            step=node_data["step"],
            cardId=node_data["cardId"],
            chosenOptionId=node_data["chosenOptionId"],
            metricsAfter=MetricsState(**node_data["metricsAfter"]),
            explanation=node_data["explanation"]
        )
        nodes.append(node)

    # Final metrics = last node's metrics
    final_metrics = nodes[-1].metricsAfter

    return SimulateAutopilotResponse(
        nodes=nodes,
        finalMetrics=final_metrics
    )


# ==================== Card Retrieval ====================

@app.get("/api/cards/{card_id}", response_model=DecisionCard)
async def get_card(card_id: str):
    """
    Retrieve a specific decision card by ID.

    Args:
        card_id: Unique card identifier

    Returns:
        Full decision card details

    Raises:
        HTTPException: If card not found
    """
    card = cards.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail=f"Card not found: {card_id}")

    return DecisionCard(**card)


# ==================== Custom Card Generation ====================

@app.post("/api/generate-custom-cards", response_model=GenerateCustomCardsResponse)
async def generate_custom_cards(request: GenerateCustomCardsRequest):
    """
    Generate custom decision cards using Gemini AI based on company profile.

    Args:
        request: Company profile and generation parameters

    Returns:
        Custom cards and initial metrics tailored to the company

    Raises:
        HTTPException: If Gemini API fails or returns invalid data
    """
    try:
        profile_dict = request.companyProfile.model_dump()

        # Generate custom cards using Gemini
        custom_cards = gemini.generate_custom_cards(
            company_profile=profile_dict,
            number_of_cards=request.numberOfCards,
            focus_areas=request.focusAreas
        )

        if not custom_cards:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate custom cards. Check GEMINI_API_KEY."
            )

        # Calculate customized initial metrics
        initial_metrics = gemini.calculate_custom_initial_metrics(profile_dict)

        scaling_context = f"""
Metrics scaled for {request.companyProfile.size} {request.companyProfile.industry} company.
Starting conditions adjusted based on stated challenges.
Company: {request.companyProfile.companyName}
Operational scale: {request.companyProfile.customMetrics.operationalScale if request.companyProfile.customMetrics else 'Standard'}
"""

        return GenerateCustomCardsResponse(
            cards=[DecisionCard(**card) for card in custom_cards],
            customizedMetrics={
                "initialMetrics": MetricsState(**initial_metrics),
                "scalingContext": scaling_context
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating custom cards: {str(e)}"
        )


# ==================== PDF Extraction ====================

@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract text content from uploaded PDF file.

    Args:
        file: PDF file upload

    Returns:
        Extracted text content

    Raises:
        HTTPException: If file is not PDF or extraction fails
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    try:
        # Read PDF file
        pdf_bytes = await file.read()

        # Extract text using PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        extracted_text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            extracted_text += page.get_text()

        doc.close()

        # Clean up text (remove excessive whitespace)
        extracted_text = " ".join(extracted_text.split())

        # Limit to reasonable length (for AI processing)
        max_length = 5000  # characters
        if len(extracted_text) > max_length:
            extracted_text = extracted_text[:max_length] + "..."

        return {
            "extractedText": extracted_text,
            "pageCount": len(doc),
            "filename": file.filename
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract PDF content: {str(e)}"
        )


# ==================== Impact Report ====================

@app.post("/api/calculate-impact")
async def calculate_impact(
    timeline_nodes: List[dict],
    final_metrics: MetricsState
):
    """
    Calculate real-world sustainability impact from timeline decisions.

    Args:
        timeline_nodes: List of decision nodes with deltas
        final_metrics: Final sustainability metrics

    Returns:
        Dict with real-world impact metrics and narrative
    """
    try:
        # Calculate impact
        impact = impact_tracker.calculate_real_world_impact(timeline_nodes)

        # Generate narrative
        narrative = impact_tracker.generate_impact_narrative(
            impact,
            final_metrics.model_dump()
        )

        return {
            "impact": impact,
            "narrative": narrative,
            "grade": impact['impact_grade']
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate impact: {str(e)}"
        )


# ==================== Root Endpoint ====================

@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Threadweaver API",
        "version": "1.0.0",
        "description": "AI-driven sustainability simulation engine",
        "endpoints": {
            "health": "/health",
            "generateDecision": "POST /api/generate-decision",
            "applyDecision": "POST /api/apply-decision",
            "simulateAutopilot": "POST /api/simulate-autopilot",
            "getCard": "GET /api/cards/{card_id}"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Run with: python -m uvicorn api.main:app --reload
# Or: uvicorn api.main:app --host 0.0.0.0 --port 8000
