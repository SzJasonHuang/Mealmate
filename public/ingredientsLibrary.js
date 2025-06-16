export const ingredientsLibrary = {
    // Ingredients data
    ingredients: [
        'chicken', 'beef', 'pork', 'salmon', 'tuna', 'shrimp', 'tofu', 'eggs',
        'onion', 'garlic', 'tomato', 'potato', 'carrot', 'broccoli', 'spinach',
        'rice', 'pasta', 'bread', 'quinoa', 'flour', 'milk', 'cheese', 'butter',
        'olive oil', 'vegetable oil', 'soy sauce', 'vinegar', 'sugar', 'salt',
        'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'macaroni',
        'cabbage', 'bell pepper', 'zucchini', 'mushroom', 'cucumber',
        'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
        'lemon', 'lime', 'peach',
        'chili pepper', 'cinnamon', 'ginger', 'turmeric', 'coconut milk',
        'almond milk', 'yogurt', 'honey'
    ],

    // Search method
    searchIngredients(query) {
        if (!query) return [];
        query = query.toLowerCase();
        return this.ingredients.filter(ingredient => 
            ingredient.toLowerCase().includes(query)
        );
    }
};