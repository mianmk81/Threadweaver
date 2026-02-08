"""
Card scoring and selection algorithm.
Implements AI decision engine that picks next card based on current state.
"""
from random import Random
from typing import List, Optional, Tuple
from .cards import load_all_cards


def filter_by_triggers(metrics: dict, cards: List[dict]) -> List[dict]:
    """
    Filter cards based on trigger conditions.

    Args:
        metrics: Current MetricsState as dict
        cards: List of all cards

    Returns:
        List of cards whose triggers are satisfied

    Example triggers:
        {"waste_min": 60, "trust_max": 40} → Only show if waste >= 60 AND trust <= 40
    """
    eligible_cards = []

    for card in cards:
        triggers = card.get("triggers")

        # No triggers = always eligible
        if not triggers:
            eligible_cards.append(card)
            continue

        # Check all trigger conditions
        is_eligible = True

        # Waste triggers
        if "waste_min" in triggers and metrics["waste"] < triggers["waste_min"]:
            is_eligible = False
        if "waste_max" in triggers and metrics["waste"] > triggers["waste_max"]:
            is_eligible = False

        # Emissions triggers
        if "emissions_min" in triggers and metrics["emissions"] < triggers["emissions_min"]:
            is_eligible = False
        if "emissions_max" in triggers and metrics["emissions"] > triggers["emissions_max"]:
            is_eligible = False

        # Cost triggers
        if "cost_min" in triggers and metrics["cost"] < triggers["cost_min"]:
            is_eligible = False
        if "cost_max" in triggers and metrics["cost"] > triggers["cost_max"]:
            is_eligible = False

        # Efficiency triggers
        if "efficiency_min" in triggers and metrics["efficiency"] < triggers["efficiency_min"]:
            is_eligible = False
        if "efficiency_max" in triggers and metrics["efficiency"] > triggers["efficiency_max"]:
            is_eligible = False

        # Trust triggers
        if "trust_min" in triggers and metrics["communityTrust"] < triggers["trust_min"]:
            is_eligible = False
        if "trust_max" in triggers and metrics["communityTrust"] > triggers["trust_max"]:
            is_eligible = False

        if is_eligible:
            eligible_cards.append(card)

    return eligible_cards


def calculate_urgency_score(metrics: dict) -> dict:
    """
    Calculate urgency scores for each metric category.
    Higher scores = more urgent problems.

    Args:
        metrics: Current MetricsState

    Returns:
        Dictionary of urgency scores per category

    Logic:
        - waste/emissions/cost: Higher values = more urgent
        - efficiency/trust: Lower values = more urgent
    """
    urgency = {
        "waste": metrics["waste"] / 100.0,  # 0-1 scale
        "emissions": metrics["emissions"] / 100.0,
        "cost": metrics["cost"] / 100.0,
        "efficiency": (100 - metrics["efficiency"]) / 100.0,  # Invert (low efficiency = urgent)
        "trust": (100 - metrics["communityTrust"]) / 100.0,  # Invert (low trust = urgent)
    }

    return urgency


def score_card(card: dict, metrics: dict, urgency: dict) -> Tuple[float, List[dict]]:
    """
    Score a single card based on current state.

    Args:
        card: Card dictionary
        metrics: Current MetricsState
        urgency: Urgency scores from calculate_urgency_score()

    Returns:
        Tuple of (total_score, scoring_factors)

    Scoring Logic:
        1. Tag matching: Cards addressing urgent metrics score higher
        2. Severity weighting: Hard cards score higher (more impactful)
        3. Baseline score to ensure variety

    Example:
        If waste is at 80 (urgent), cards with 'waste' tag get +urgency boost
    """
    score = 10.0  # Baseline score
    factors = []

    # 1. Tag urgency matching
    card_tags = card.get("tags", [])
    tag_boost = 0.0

    for tag in card_tags:
        if tag in urgency:
            tag_urgency = urgency[tag]
            tag_boost += tag_urgency * 30  # Max +30 points per urgent tag

            if tag_urgency > 0.6:  # High urgency threshold
                factors.append({
                    "factor": f"High {tag} urgency",
                    "score": tag_urgency * 30,
                    "reason": f"{tag.capitalize()} is at {metrics.get(tag, 0):.0f}, requiring attention"
                })

    score += tag_boost

    # 2. Severity weighting
    severity = card.get("severity", "medium")
    severity_weights = {"easy": 1.0, "medium": 1.5, "hard": 2.0}
    severity_multiplier = severity_weights.get(severity, 1.0)
    score *= severity_multiplier

    if severity == "hard":
        factors.append({
            "factor": "High-impact decision",
            "score": (severity_multiplier - 1) * score,
            "reason": f"This is a {severity} decision with significant long-term effects"
        })

    # 3. Balance score (encourage addressing underperforming metrics)
    sustainability_score = metrics.get("sustainabilityScore", 50)
    if sustainability_score < 40:
        score += 15
        factors.append({
            "factor": "Low sustainability score",
            "score": 15,
            "reason": f"Overall sustainability at {sustainability_score:.0f} needs improvement"
        })

    return score, factors


def select_card(
    metrics: dict,
    used_card_ids: List[str],
    seed: Optional[int] = None
) -> Tuple[Optional[dict], str, dict]:
    """
    Select the next decision card using AI scoring algorithm.

    Args:
        metrics: Current MetricsState as dict
        used_card_ids: List of card IDs already used in this session
        seed: Optional random seed for deterministic selection

    Returns:
        Tuple of (selected_card, rationale, scoring_details)

    Algorithm:
        1. Load all cards
        2. Filter out used cards
        3. Filter by triggers
        4. Score each eligible card
        5. Add seeded randomness
        6. Return top card with explanation
    """
    # Create local Random instance for thread-safe randomness
    rng = Random(seed) if seed is not None else Random()

    # 1. Load all cards
    all_cards = load_all_cards()

    # 2. Filter out used cards
    available_cards = [card for card in all_cards if card["id"] not in used_card_ids]

    # Fallback: If all cards used, allow reuse (important for long timelines/autopilot)
    if not available_cards:
        print(f"All {len(all_cards)} cards have been used. Allowing card reuse.")
        available_cards = all_cards

    # 3. Filter by triggers
    eligible_cards = filter_by_triggers(metrics, available_cards)

    # Fallback: If no cards match triggers, use any available card
    if not eligible_cards:
        print(f"No cards match current triggers. Using {len(available_cards)} available cards.")
        eligible_cards = available_cards

    # 4. Calculate urgency and score cards
    urgency = calculate_urgency_score(metrics)
    scored_cards = []

    for card in eligible_cards:
        score, factors = score_card(card, metrics, urgency)
        scored_cards.append({
            "card": card,
            "score": score,
            "factors": factors
        })

    # 5. Sort by score (descending)
    scored_cards.sort(key=lambda x: x["score"], reverse=True)

    # 6. Add weighted randomness to top 3 candidates
    top_candidates = scored_cards[:min(3, len(scored_cards))]

    # Weighted random selection (higher scores = higher probability)
    weights = [c["score"] for c in top_candidates]
    selected = rng.choices(top_candidates, weights=weights, k=1)[0]

    # Build rationale
    top_factors = selected["factors"][:3]  # Top 3 reasons
    if top_factors:
        rationale = "This card was chosen because: " + "; ".join(
            [f"{f['factor']} ({f['reason']})" for f in top_factors]
        )
    else:
        rationale = f"This {selected['card']['severity']} decision addresses current sustainability needs."

    scoring_details = {
        "finalScore": selected["score"],
        "topFactors": top_factors,
        "candidatesConsidered": len(top_candidates),
        "totalEligible": len(eligible_cards)
    }

    return selected["card"], rationale, scoring_details
