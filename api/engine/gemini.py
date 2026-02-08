"""
Gemini AI integration for generating custom decision cards.
Uses Google's Generative AI to create personalized sustainability scenarios.
"""
import os
import json
import google.generativeai as genai
from typing import List, Dict, Any

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def generate_custom_cards(
    company_profile: Dict[str, Any],
    number_of_cards: int = 10,
    focus_areas: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate custom decision cards using Gemini AI based on company profile.

    Args:
        company_profile: Company information (name, industry, size, challenges, goals)
        number_of_cards: Number of cards to generate (5-30)
        focus_areas: Optional list of focus areas (e.g., ["waste", "emissions"])

    Returns:
        List of decision card dictionaries
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set")

    # Build context from company profile
    company_context = f"""
Company: {company_profile.get('companyName', 'Unknown')}
Industry: {company_profile.get('industry', 'General')}
Size: {company_profile.get('size', 'medium')} ({get_size_description(company_profile.get('size'))})
Location: {company_profile.get('location', 'Not specified')}
Description: {company_profile.get('description', 'Not provided')}

Current Challenges: {', '.join(company_profile.get('currentChallenges', [])) or 'None specified'}
Sustainability Goals: {', '.join(company_profile.get('sustainabilityGoals', [])) or 'None specified'}
"""

    focus_context = ""
    if focus_areas:
        focus_context = f"\nFocus primarily on these areas: {', '.join(focus_areas)}"

    prompt = f"""You are a sustainability consultant creating realistic decision scenarios for a company.

{company_context}{focus_context}

Generate {number_of_cards} realistic sustainability decision cards that this company would actually face. Each card should:
1. Be specific to their industry and context
2. Present realistic tradeoffs (no perfect "win-win" options)
3. Have 2-3 options with clear pros/cons
4. Include metric impacts (waste, emissions, cost, efficiency, communityTrust)

For each card, provide:
- id: unique slug (e.g., "waste-reduction-initiative")
- title: Clear decision title
- prompt: The decision question
- tags: Array of relevant tags (waste, emissions, cost, efficiency, trust, policy)
- severity: "easy", "medium", or "hard"
- triggers: Conditions when this card appears (waste_min, waste_max, etc. - 0-100 scale)
- options: 2-3 choices, each with:
  - id: unique option id
  - label: Short option name
  - description: What this option means
  - deltas: Impact on metrics (waste, emissions, cost, efficiency, communityTrust) - values from -20 to +20
    * For waste, emissions, cost: negative is good (reduction)
    * For efficiency, trust: positive is good (improvement)
  - explanation: Why this option works this way

Return ONLY a valid JSON array of card objects, no other text.

Example format:
[
  {{
    "id": "energy-audit",
    "title": "Energy Efficiency Audit",
    "prompt": "An energy audit reveals opportunities to reduce consumption. How do you proceed?",
    "tags": ["emissions", "cost", "efficiency"],
    "severity": "medium",
    "triggers": {{"emissions_min": 40}},
    "options": [
      {{
        "id": "full-upgrade",
        "label": "Full LED and HVAC upgrade",
        "description": "Replace all lighting and upgrade HVAC systems",
        "deltas": {{
          "waste": 0,
          "emissions": -15,
          "cost": 10,
          "efficiency": 12,
          "communityTrust": 8
        }},
        "explanation": "High upfront cost but significant long-term emissions reduction"
      }}
    ]
  }}
]
"""

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)

        # Extract JSON from response
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # Parse JSON
        cards = json.loads(response_text)

        # Validate basic structure
        if not isinstance(cards, list):
            raise ValueError("Response is not a JSON array")

        # Ensure required fields
        for card in cards:
            if 'options' not in card or not card['options']:
                card['options'] = []

        return cards

    except Exception as e:
        print(f"Error generating cards with Gemini: {str(e)}")
        # Return empty list on error
        return []


def get_size_description(size: str) -> str:
    """Get employee count description for company size."""
    size_map = {
        'small': '1-50 employees',
        'medium': '50-500 employees',
        'large': '500-5000 employees',
        'enterprise': '5000+ employees'
    }
    return size_map.get(size, 'unknown size')


def calculate_custom_initial_metrics(
    company_profile: Dict[str, Any]
) -> Dict[str, float]:
    """
    Calculate customized initial metrics based on company profile.
    Adjusts starting point based on stated challenges and company size.

    Returns:
        Dictionary with initial metric values (0-100 scale)
    """
    # Start with baseline
    metrics = {
        'waste': 50.0,
        'emissions': 50.0,
        'cost': 50.0,
        'efficiency': 50.0,
        'communityTrust': 50.0,
    }

    challenges = company_profile.get('currentChallenges', [])
    size = company_profile.get('size', 'medium')

    # Adjust based on stated challenges (higher = worse)
    challenge_impacts = {
        'High waste generation': {'waste': 15},
        'Carbon emissions': {'emissions': 15},
        'Energy consumption': {'emissions': 10, 'cost': 5},
        'Supply chain sustainability': {'emissions': 8, 'cost': 5},
        'Cost management': {'cost': 15},
        'Regulatory compliance': {'emissions': 5, 'waste': 5},
        'Resource efficiency': {'efficiency': -10, 'waste': 10},
    }

    for challenge in challenges:
        if challenge in challenge_impacts:
            for metric, delta in challenge_impacts[challenge].items():
                metrics[metric] += delta

    # Larger companies tend to have more established processes
    size_efficiency_bonus = {
        'small': -5,
        'medium': 0,
        'large': 5,
        'enterprise': 10
    }
    metrics['efficiency'] += size_efficiency_bonus.get(size, 0)

    # Cap all values between 0 and 100
    for key in metrics:
        metrics[key] = max(0, min(100, metrics[key]))

    # Calculate sustainability score
    metrics['sustainabilityScore'] = (
        (100 - metrics['waste']) * 0.25 +
        (100 - metrics['emissions']) * 0.25 +
        (100 - metrics['cost']) * 0.15 +
        metrics['efficiency'] * 0.20 +
        metrics['communityTrust'] * 0.15
    )

    return metrics
