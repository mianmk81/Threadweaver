"""
Card library management utilities.
Loads, validates, and caches decision cards from data/cards.json.
"""
import json
from pathlib import Path
from typing import List, Optional
from functools import lru_cache

# Get project root directory (api/engine -> api -> threadweaver)
PROJECT_ROOT = Path(__file__).parent.parent.parent
CARDS_PATH = PROJECT_ROOT / "data" / "cards.json"


@lru_cache(maxsize=1)
def load_all_cards() -> List[dict]:
    """
    Load all decision cards from data/cards.json.
    Cached to avoid repeated file reads.

    Returns:
        List of card dictionaries

    Raises:
        FileNotFoundError: If cards.json doesn't exist
        json.JSONDecodeError: If cards.json is invalid JSON
    """
    if not CARDS_PATH.exists():
        raise FileNotFoundError(f"Cards file not found at {CARDS_PATH}")

    with open(CARDS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Handle both {"cards": [...]} and [...] formats
    if isinstance(data, dict) and "cards" in data:
        cards = data["cards"]
    elif isinstance(data, list):
        cards = data
    else:
        raise ValueError("cards.json must contain either a JSON array or an object with a 'cards' key")

    if not isinstance(cards, list):
        raise ValueError("cards must be a JSON array")

    return cards


def get_card_by_id(card_id: str) -> Optional[dict]:
    """
    Retrieve a specific card by ID.

    Args:
        card_id: Unique card identifier

    Returns:
        Card dictionary or None if not found
    """
    cards = load_all_cards()
    for card in cards:
        if card.get("id") == card_id:
            return card
    return None


def get_cards_by_tags(tags: List[str]) -> List[dict]:
    """
    Filter cards that have at least one matching tag.

    Args:
        tags: List of tag strings to match

    Returns:
        List of matching cards
    """
    cards = load_all_cards()
    matching_cards = []

    for card in cards:
        card_tags = card.get("tags", [])
        if any(tag in card_tags for tag in tags):
            matching_cards.append(card)

    return matching_cards


def get_cards_by_severity(severity: str) -> List[dict]:
    """
    Filter cards by severity level.

    Args:
        severity: 'easy', 'medium', or 'hard'

    Returns:
        List of matching cards
    """
    cards = load_all_cards()
    return [card for card in cards if card.get("severity") == severity]


def validate_cards() -> tuple[bool, List[str]]:
    """
    Validate all cards have required fields.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    try:
        cards = load_all_cards()
    except Exception as e:
        return False, [f"Failed to load cards: {str(e)}"]

    errors = []
    required_card_fields = ["id", "title", "prompt", "tags", "severity", "options"]
    required_option_fields = ["id", "label", "description", "deltas", "explanation"]

    for i, card in enumerate(cards):
        # Check required card fields
        for field in required_card_fields:
            if field not in card:
                errors.append(f"Card {i} missing required field: {field}")

        # Check options
        options = card.get("options", [])
        if len(options) < 2 or len(options) > 3:
            errors.append(f"Card {card.get('id', i)} must have 2-3 options, found {len(options)}")

        for j, option in enumerate(options):
            for field in required_option_fields:
                if field not in option:
                    errors.append(f"Card {card.get('id', i)}, option {j} missing field: {field}")

            # Check deltas
            deltas = option.get("deltas", {})
            required_deltas = ["waste", "emissions", "cost", "efficiency", "communityTrust"]
            for delta_key in required_deltas:
                if delta_key not in deltas:
                    errors.append(f"Card {card.get('id', i)}, option {option.get('id', j)} missing delta: {delta_key}")

    return len(errors) == 0, errors


def get_card_count() -> int:
    """Get total number of cards in library."""
    return len(load_all_cards())


def clear_cache():
    """Clear the card cache (useful for testing or hot-reload)."""
    load_all_cards.cache_clear()
