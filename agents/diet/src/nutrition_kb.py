"""Curated Indian ingredient-substitution knowledge base for the demo.

Maps expensive / unavailable (often Western) ingredients to nutritionally
comparable, affordable, locally-available Indian alternatives. In production
this is a 200+ item Firestore collection; here it is a focused, demonstrable
subset. Costs are rough INR estimates for illustration.
"""

# key = lowercase original ingredient
SUBSTITUTIONS = {
    "quinoa": {
        "substitute": "Broken Wheat (Dalia)", "emoji": "🌾",
        "nutrients": [
            {"name": "Protein", "original": 14, "substitute": 12, "unit": "g", "status": "good"},
            {"name": "Fiber", "original": 7, "substitute": 5, "unit": "g", "status": "good"},
            {"name": "Iron", "original": 4.6, "substitute": 3.9, "unit": "mg", "status": "good"},
        ],
        "cost_original": "₹800/kg", "cost_substitute": "₹60/kg", "savings": "92%",
        "availability": "Available in every kirana store",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
    "avocado": {
        "substitute": "Mashed Banana + Flaxseed", "emoji": "🍌",
        "nutrients": [
            {"name": "Healthy Fats", "original": 15, "substitute": 13, "unit": "g", "status": "good"},
            {"name": "Potassium", "original": 485, "substitute": 422, "unit": "mg", "status": "good"},
            {"name": "Vitamin E", "original": 2.1, "substitute": 1.5, "unit": "mg", "status": "warn"},
        ],
        "cost_original": "₹250/pc", "cost_substitute": "₹5 + ₹40", "savings": "82%",
        "availability": "Widely available across India",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
    "chia seeds": {
        "substitute": "Sabja (Basil Seeds)", "emoji": "🫘",
        "nutrients": [
            {"name": "Omega-3", "original": 5, "substitute": 2.5, "unit": "g", "status": "warn"},
            {"name": "Fiber", "original": 10, "substitute": 7, "unit": "g", "status": "good"},
            {"name": "Calcium", "original": 179, "substitute": 154, "unit": "mg", "status": "good"},
        ],
        "cost_original": "₹1500/kg", "cost_substitute": "₹200/kg", "savings": "87%",
        "availability": "Local markets & online",
        "warning": "Lower omega-3; consider adding walnuts",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
    "kale": {
        "substitute": "Palak / Bathua / Moringa leaves", "emoji": "🥬",
        "nutrients": [
            {"name": "Vitamin A", "original": 500, "substitute": 470, "unit": "mcg", "status": "good"},
            {"name": "Iron", "original": 1.5, "substitute": 2.7, "unit": "mg", "status": "good"},
            {"name": "Vitamin C", "original": 80, "substitute": 28, "unit": "mg", "status": "warn"},
        ],
        "cost_original": "₹300/kg", "cost_substitute": "₹40/kg", "savings": "87%",
        "availability": "Every vegetable vendor",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
    "blueberries": {
        "substitute": "Jamun / Amla", "emoji": "🫐",
        "nutrients": [
            {"name": "Antioxidants", "original": 9, "substitute": 11, "unit": "mmol", "status": "good"},
            {"name": "Vitamin C", "original": 9.7, "substitute": 600, "unit": "mg", "status": "good"},
            {"name": "Fiber", "original": 2.4, "substitute": 3.6, "unit": "g", "status": "good"},
        ],
        "cost_original": "₹900/kg", "cost_substitute": "₹120/kg", "savings": "86%",
        "availability": "Seasonal, local markets",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
    "tofu": {
        "substitute": "Paneer / Sprouted Moong", "emoji": "🧀",
        "nutrients": [
            {"name": "Protein", "original": 8, "substitute": 18, "unit": "g", "status": "good"},
            {"name": "Calcium", "original": 350, "substitute": 208, "unit": "mg", "status": "warn"},
            {"name": "Fat", "original": 4, "substitute": 20, "unit": "g", "status": "warn"},
        ],
        "cost_original": "₹400/kg", "cost_substitute": "₹350/kg", "savings": "12%",
        "availability": "Every dairy / kirana store",
        "warning": "Paneer is higher in fat — use sprouted moong for a leaner swap",
        "tags": ["vegetarian"], "high_gi": False,
    },
    "almond milk": {
        "substitute": "Toned Dairy Milk / Peanut Milk", "emoji": "🥛",
        "nutrients": [
            {"name": "Protein", "original": 1, "substitute": 3.3, "unit": "g", "status": "good"},
            {"name": "Calcium", "original": 120, "substitute": 125, "unit": "mg", "status": "good"},
        ],
        "cost_original": "₹250/L", "cost_substitute": "₹60/L", "savings": "76%",
        "availability": "Everywhere",
        "tags": ["vegetarian"], "high_gi": False,
    },
    "olive oil": {
        "substitute": "Mustard Oil / Groundnut Oil", "emoji": "🛢️",
        "nutrients": [
            {"name": "MUFA", "original": 10, "substitute": 8, "unit": "g", "status": "good"},
        ],
        "cost_original": "₹900/L", "cost_substitute": "₹180/L", "savings": "80%",
        "availability": "Everywhere",
        "tags": ["vegetarian", "vegan", "jain"], "high_gi": False,
    },
}

# foods to flag for specific conditions
SAFETY_RULES = {
    "pregnancy": {"unsafe": ["raw papaya", "papaya", "excess fenugreek", "high-mercury fish"]},
    "diabetes": {"avoid_high_gi": True},
}
