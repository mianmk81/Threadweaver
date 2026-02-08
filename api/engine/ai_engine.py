"""
AI Decision Engine - Hybrid multi-model system
Orchestrates multiple AI models for intelligent decision-making:
- Gemini 2.0 Flash: LLM reasoning and validation
- ESG-BERT: Sustainability text classification
- Algorithmic optimization: Fast filtering and scoring
"""
import os
import json
from typing import Dict, List, Tuple, Optional
from functools import lru_cache
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class AIDecisionEngine:
    """
    Multi-model AI engine for sustainability decision-making

    Architecture:
    1. Algorithmic filtering (fast, deterministic)
    2. ESG-BERT classification (ML, category detection)
    3. Gemini validation (LLM, contextual reasoning)
    """

    def __init__(self):
        """Initialize all AI models"""
        # Gemini LLM
        self.gemini_model = None
        if GEMINI_API_KEY:
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # ESG-BERT classifier (lazy loaded)
        self._esg_classifier = None

    @property
    def esg_classifier(self):
        """Lazy load ESG-BERT model (heavy, only load when needed)"""
        if self._esg_classifier is None:
            try:
                from transformers import pipeline
                print("Loading ESG-BERT model...")
                self._esg_classifier = pipeline(
                    "text-classification",
                    model="nbroad/ESG-BERT",
                    device=-1  # CPU (set to 0 for GPU)
                )
                print("ESG-BERT loaded successfully")
            except Exception as e:
                print(f"Warning: Could not load ESG-BERT: {e}")
                self._esg_classifier = None
        return self._esg_classifier

    def classify_sustainability_category(self, text: str) -> Dict[str, float]:
        """
        Use ESG-BERT to classify sustainability category

        Args:
            text: Decision text to classify

        Returns:
            Dict with category and confidence score
        """
        if self.esg_classifier is None:
            return {'label': 'Environmental', 'score': 0.5}  # Fallback

        try:
            result = self.esg_classifier(text[:512])  # Limit token length
            return {
                'label': result[0]['label'],
                'score': result[0]['score']
            }
        except Exception as e:
            print(f"ESG-BERT classification error: {e}")
            return {'label': 'Environmental', 'score': 0.5}

    def validate_card_with_gemini(
        self,
        card: dict,
        metrics: dict,
        max_retries: int = 2
    ) -> Dict[str, any]:
        """
        Use Gemini to validate and enhance card selection

        Args:
            card: Decision card to validate
            metrics: Current sustainability metrics
            max_retries: Number of retry attempts

        Returns:
            Dict with confidence, reasoning, and priority
        """
        if self.gemini_model is None:
            return {
                'confidence': 0.5,
                'reasoning': 'Gemini not available',
                'priority_level': 'medium'
            }

        prompt = f"""You are a sustainability expert evaluating a decision.

Current Sustainability Metrics (0-100 scale):
- Waste: {metrics['waste']}/100 (lower is better)
- Emissions: {metrics['emissions']}/100 (lower is better)
- Cost: {metrics['cost']}/100 (lower is better)
- Efficiency: {metrics['efficiency']}/100 (higher is better)
- Community Trust: {metrics['communityTrust']}/100 (higher is better)
- Overall Score: {metrics['sustainabilityScore']}/100

Decision to Evaluate:
Title: {card['title']}
Question: {card['prompt']}
Tags: {', '.join(card.get('tags', []))}
Severity: {card.get('severity', 'medium')}

Analyze this decision:
1. How relevant is it given the current metrics? (0.0-1.0)
2. Why is it important or not important right now?
3. What is the priority level?

Return ONLY valid JSON (no markdown):
{{
    "confidence": 0.85,
    "reasoning": "brief explanation under 100 words",
    "priority_level": "critical|high|medium|low"
}}"""

        for attempt in range(max_retries):
            try:
                response = self.gemini_model.generate_content(prompt)
                text = response.text.strip()

                # Remove markdown code blocks if present
                if text.startswith('```json'):
                    text = text[7:]
                if text.startswith('```'):
                    text = text[3:]
                if text.endswith('```'):
                    text = text[:-3]
                text = text.strip()

                result = json.loads(text)

                # Validate result
                if 'confidence' in result and 'reasoning' in result:
                    # Clamp confidence to 0-1 range
                    result['confidence'] = max(0.0, min(1.0, float(result['confidence'])))
                    return result

            except Exception as e:
                print(f"Gemini validation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    # Final fallback
                    return {
                        'confidence': 0.5,
                        'reasoning': f'Card addresses {", ".join(card.get("tags", []))}',
                        'priority_level': 'medium'
                    }

        # Should never reach here, but just in case
        return {
            'confidence': 0.5,
            'reasoning': 'Default reasoning',
            'priority_level': 'medium'
        }

    def enhance_card_selection(
        self,
        top_cards: List[dict],
        metrics: dict,
        algorithm_scores: List[float]
    ) -> Tuple[dict, str, dict]:
        """
        Multi-model hybrid selection

        Pipeline:
        1. ESG-BERT: Classify each card
        2. Gemini: Validate top candidates
        3. Combine scores: 70% algorithm + 25% Gemini + 5% ESG-BERT

        Args:
            top_cards: Top 3 cards from algorithm
            metrics: Current metrics
            algorithm_scores: Scores from algorithmic filtering

        Returns:
            Tuple of (best_card, rationale, scoring_details)
        """
        enhanced_cards = []

        for i, card in enumerate(top_cards):
            # Get algorithm score
            algo_score = algorithm_scores[i] if i < len(algorithm_scores) else 0

            # ESG-BERT classification (5% weight)
            esg_result = self.classify_sustainability_category(
                f"{card['title']}. {card['prompt']}"
            )
            esg_boost = esg_result['score'] * 5  # Max 5 points

            # Gemini validation (25% weight)
            gemini_result = self.validate_card_with_gemini(card, metrics)
            gemini_boost = gemini_result['confidence'] * 25  # Max 25 points

            # Combined score
            final_score = (
                algo_score * 0.70 +      # Algorithm 70%
                gemini_boost +           # Gemini 25%
                esg_boost                # ESG-BERT 5%
            )

            enhanced_cards.append({
                'card': card,
                'algorithm_score': algo_score,
                'esg_category': esg_result['label'],
                'esg_confidence': esg_result['score'],
                'gemini_confidence': gemini_result['confidence'],
                'gemini_reasoning': gemini_result['reasoning'],
                'gemini_priority': gemini_result['priority_level'],
                'final_score': final_score
            })

        # Select best card
        best = max(enhanced_cards, key=lambda x: x['final_score'])

        # Build comprehensive rationale
        rationale = f"""AI Analysis: {best['gemini_reasoning']}

Classification: {best['esg_category']} (ESG-BERT confidence: {best['esg_confidence']:.0%})
Priority Level: {best['gemini_priority']}
AI Confidence: {best['gemini_confidence']:.0%}"""

        scoring_details = {
            'finalScore': best['final_score'],
            'algorithmScore': best['algorithm_score'],
            'geminiConfidence': best['gemini_confidence'],
            'esgCategory': best['esg_category'],
            'esgConfidence': best['esg_confidence'],
            'priorityLevel': best['gemini_priority'],
            'aiReasoning': best['gemini_reasoning']
        }

        return best['card'], rationale, scoring_details


# Global singleton instance
_ai_engine_instance = None

def get_ai_engine() -> AIDecisionEngine:
    """Get global AI engine instance (singleton pattern)"""
    global _ai_engine_instance
    if _ai_engine_instance is None:
        _ai_engine_instance = AIDecisionEngine()
    return _ai_engine_instance
