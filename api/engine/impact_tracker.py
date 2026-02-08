"""
Impact Tracker - Calculate real-world sustainability impact
Converts game metrics into tangible real-world equivalents
"""
from typing import Dict, List


def calculate_real_world_impact(decisions: List[Dict]) -> Dict[str, any]:
    """
    Calculate cumulative real-world impact from user decisions

    Converts abstract metrics into tangible real-world equivalents:
    - CO2 saved (kg)
    - Trees planted equivalent
    - Cars off road equivalent
    - Water saved (liters)
    - Waste diverted (kg)

    Args:
        decisions: List of decision nodes with deltas

    Returns:
        Dict with real-world impact metrics
    """
    # Cumulative deltas
    total_waste_reduction = 0
    total_emissions_reduction = 0
    total_cost_savings = 0
    total_efficiency_gain = 0
    total_trust_gain = 0

    for decision in decisions:
        # Sum up all deltas
        if 'deltas' in decision:
            deltas = decision['deltas']
            total_waste_reduction += deltas.get('waste', 0)
            total_emissions_reduction += deltas.get('emissions', 0)
            total_cost_savings += deltas.get('cost', 0)
            total_efficiency_gain += deltas.get('efficiency', 0)
            total_trust_gain += deltas.get('communityTrust', 0)

    # Convert abstract metrics to real-world equivalents
    # Scaling factors (adjust based on company size)
    # Assuming medium-sized restaurant/dining operation

    # Waste reduction (metric points → kg waste)
    # 1 point = ~50 kg waste/month
    waste_kg_saved = abs(total_waste_reduction) * 50

    # Emissions reduction (metric points → kg CO2)
    # 1 point = ~100 kg CO2/month
    co2_kg_saved = abs(total_emissions_reduction) * 100

    # Real-world equivalents
    impact = {
        # Primary metrics
        'waste_kg_saved': round(waste_kg_saved, 1),
        'co2_kg_saved': round(co2_kg_saved, 1),
        'cost_savings_usd': round(abs(total_cost_savings) * 500, 0),  # 1 point = $500

        # Tangible equivalents
        'trees_equivalent': round(co2_kg_saved / 21.77, 1),  # kg CO2 absorbed per tree/year
        'cars_off_road_days': round(co2_kg_saved / 12.6, 1),  # kg CO2 per car per day
        'plastic_bottles_saved': round(waste_kg_saved / 0.02, 0),  # 20g per bottle

        # Water impact (indirect)
        'water_liters_saved': round(waste_kg_saved * 15, 0),  # ~15L water per kg food waste

        # Summary scores
        'total_decisions': len(decisions),
        'efficiency_improvement': round(total_efficiency_gain, 1),
        'community_trust_gain': round(total_trust_gain, 1),

        # Impact grade
        'impact_grade': _calculate_impact_grade(co2_kg_saved, waste_kg_saved)
    }

    return impact


def _calculate_impact_grade(co2_saved: float, waste_saved: float) -> str:
    """
    Calculate overall impact grade based on savings

    Args:
        co2_saved: Total CO2 saved in kg
        waste_saved: Total waste saved in kg

    Returns:
        Grade: A+, A, B, C, D, or F
    """
    total_impact = co2_saved + waste_saved

    if total_impact >= 5000:
        return 'A+'
    elif total_impact >= 3000:
        return 'A'
    elif total_impact >= 2000:
        return 'B'
    elif total_impact >= 1000:
        return 'C'
    elif total_impact >= 500:
        return 'D'
    else:
        return 'F'


def generate_impact_narrative(impact: Dict, metrics: Dict) -> str:
    """
    Generate inspiring narrative about user's impact

    Args:
        impact: Real-world impact metrics
        metrics: Final sustainability metrics

    Returns:
        Markdown-formatted impact story
    """
    grade = impact['impact_grade']
    co2_saved = impact['co2_kg_saved']
    trees = impact['trees_equivalent']
    waste_kg = impact['waste_kg_saved']
    bottles = impact['plastic_bottles_saved']

    # Grade-specific messaging
    grade_messages = {
        'A+': ' **Outstanding Impact!** You\'re a sustainability champion!',
        'A': ' **Excellent Work!** Your decisions are making a real difference.',
        'B': ' **Good Progress!** You\'re on the right track.',
        'C': ' **Solid Start!** Keep building on this foundation.',
        'D': ' **Room for Growth** - Consider more ambitious sustainability choices.',
        'F': ' **Early Stages** - Focus on high-impact decisions next time.'
    }

    narrative = f"""## Your Sustainability Impact Report

{grade_messages.get(grade, '')}

###  Real-World Impact

Your {impact['total_decisions']} decisions have achieved:

**Climate Impact:**
-  **{co2_saved:,.0f} kg CO2** prevented from entering the atmosphere
-  Equivalent to planting **{trees:.0f} trees** for one year
-  Like taking a car off the road for **{impact['cars_off_road_days']:.0f} days**

**Waste Reduction:**
-  **{waste_kg:,.0f} kg of waste** diverted from landfills
-  Equivalent to **{bottles:,.0f} plastic bottles** not produced
-  Saved approximately **{impact['water_liters_saved']:,.0f} liters** of water

**Economic Impact:**
-  Cost savings: **${impact['cost_savings_usd']:,.0f}** annually
-  Efficiency improved by **{impact['efficiency_improvement']:.0f} points**
-  Community trust increased by **{impact['community_trust_gain']:.0f} points**

###  Final Sustainability Score: {metrics.get('sustainabilityScore', 50):.0f}/100

**Overall Grade: {grade}**

---

*Keep up the great work! Every decision compounds over time.* 
"""

    return narrative
