"""
Autopilot simulation engine.
Automatically selects best options and simulates full timeline runs.
"""
from typing import List, Optional, Tuple
from copy import deepcopy
from .scoring import select_card


def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def calculate_sustainability_score(metrics: dict) -> float:
    """
    Calculate aggregate sustainability score from base metrics.

    Formula:
        sustainabilityScore = (
            (100 - waste) * 0.25 +
            (100 - emissions) * 0.25 +
            (100 - cost) * 0.15 +
            efficiency * 0.20 +
            communityTrust * 0.15
        )

    Args:
        metrics: Dictionary with waste, emissions, cost, efficiency, communityTrust

    Returns:
        Sustainability score (0-100)
    """
    score = (
        (100 - metrics["waste"]) * 0.25 +
        (100 - metrics["emissions"]) * 0.25 +
        (100 - metrics["cost"]) * 0.15 +
        metrics["efficiency"] * 0.20 +
        metrics["communityTrust"] * 0.15
    )
    return clamp(score, 0, 100)


def apply_deltas(metrics: dict, deltas: dict) -> dict:
    """
    Apply option deltas to current metrics.

    Args:
        metrics: Current MetricsState
        deltas: Dictionary of metric changes (waste, emissions, cost, efficiency, communityTrust)

    Returns:
        New MetricsState with updated values (clamped to 0-100)
    """
    new_metrics = deepcopy(metrics)

    # Apply deltas to base metrics
    for key in ["waste", "emissions", "cost", "efficiency", "communityTrust"]:
        if key in deltas:
            new_metrics[key] = clamp(new_metrics[key] + deltas[key])

    # Recalculate sustainability score
    new_metrics["sustainabilityScore"] = calculate_sustainability_score(new_metrics)

    return new_metrics


def evaluate_option(option: dict, metrics: dict) -> Tuple[float, str]:
    """
    Evaluate an option using weighted objective function.

    Autopilot Goal:
        - Maximize sustainability score
        - Penalize cost spikes
        - Penalize trust drops
        - Encourage efficiency gains

    Args:
        option: Decision option with deltas
        deltas: Metric changes

    Returns:
        Tuple of (objective_score, explanation)
    """
    deltas = option["deltas"]

    # Simulate applying this option
    projected_metrics = apply_deltas(metrics, deltas)

    # Calculate objective components
    score_gain = projected_metrics["sustainabilityScore"] - metrics["sustainabilityScore"]

    cost_penalty = 0
    if deltas.get("cost", 0) > 10:  # Penalize large cost increases
        cost_penalty = deltas["cost"] * -2

    trust_penalty = 0
    if deltas.get("communityTrust", 0) < -5:  # Penalize trust drops
        trust_penalty = deltas["communityTrust"] * 3

    efficiency_bonus = deltas.get("efficiency", 0) * 1.5  # Reward efficiency

    # Weighted objective
    objective_score = (
        score_gain * 5.0 +       # Prioritize sustainability score
        cost_penalty +
        trust_penalty +
        efficiency_bonus
    )

    # Build explanation
    reasons = []
    if score_gain > 0:
        reasons.append(f"+{score_gain:.1f} sustainability score")
    if deltas.get("waste", 0) < 0:
        reasons.append(f"{deltas['waste']:.0f} waste reduction")
    if deltas.get("emissions", 0) < 0:
        reasons.append(f"{deltas['emissions']:.0f} emissions reduction")
    if deltas.get("efficiency", 0) > 0:
        reasons.append(f"+{deltas['efficiency']:.0f} efficiency gain")
    if deltas.get("communityTrust", 0) > 0:
        reasons.append(f"+{deltas['communityTrust']:.0f} community trust")

    explanation = f"Selected '{option['label']}': {', '.join(reasons)}"

    return objective_score, explanation


def select_best_option(card: dict, metrics: dict) -> Tuple[dict, str]:
    """
    Automatically select the best option from a decision card.

    Args:
        card: Decision card with multiple options
        metrics: Current MetricsState

    Returns:
        Tuple of (best_option, explanation)
    """
    options = card["options"]

    # Evaluate each option
    evaluated = []
    for option in options:
        score, explanation = evaluate_option(option, metrics)
        evaluated.append({
            "option": option,
            "score": score,
            "explanation": explanation
        })

    # Sort by objective score (descending)
    evaluated.sort(key=lambda x: x["score"], reverse=True)

    best = evaluated[0]
    return best["option"], best["explanation"]


def simulate_step(
    current_metrics: dict,
    card: dict,
    chosen_option_id: Optional[str] = None
) -> Tuple[dict, str]:
    """
    Simulate a single decision step.

    Args:
        current_metrics: Current MetricsState
        card: Decision card
        chosen_option_id: Specific option to apply (if None, autopilot selects best)

    Returns:
        Tuple of (new_metrics, explanation)
    """
    # Find the option
    if chosen_option_id:
        # User-specified option
        option = next((opt for opt in card["options"] if opt["id"] == chosen_option_id), None)
        if not option:
            raise ValueError(f"Option {chosen_option_id} not found in card {card['id']}")
        explanation = option["explanation"]
    else:
        # Autopilot: select best option
        option, explanation = select_best_option(card, current_metrics)

    # Apply deltas
    new_metrics = apply_deltas(current_metrics, option["deltas"])

    return new_metrics, explanation


def simulate_full_run(
    initial_metrics: dict,
    steps: int,
    start_step: int = 1,
    used_card_ids: Optional[List[str]] = None,
    seed: Optional[int] = None
) -> List[dict]:
    """
    Run a complete autopilot simulation.

    Args:
        initial_metrics: Starting MetricsState
        steps: Number of decision steps to simulate
        start_step: Step number to start from (for branched threads, e.g., 5)
        used_card_ids: Cards already used in this timeline (to avoid repeats)
        seed: Optional random seed for deterministic card selection

    Returns:
        List of timeline nodes (each with step, cardId, chosenOptionId, metricsAfter, explanation)
    """
    nodes = []
    current_metrics = deepcopy(initial_metrics)
    used_card_ids = used_card_ids.copy() if used_card_ids else []

    for i in range(steps):
        step = start_step + i
        # Select next card
        card, rationale, scoring_details = select_card(
            current_metrics,
            used_card_ids,
            seed=seed + step if seed else None  # Vary seed per step
        )

        if not card:
            # No more eligible cards
            break

        # Autopilot: select best option
        best_option, explanation = select_best_option(card, current_metrics)

        # Apply decision
        new_metrics = apply_deltas(current_metrics, best_option["deltas"])

        # Create node
        node = {
            "step": step,
            "cardId": card["id"],
            "chosenOptionId": best_option["id"],
            "metricsAfter": new_metrics,
            "explanation": explanation
        }

        nodes.append(node)

        # Update state for next iteration
        current_metrics = new_metrics
        used_card_ids.append(card["id"])

    return nodes
