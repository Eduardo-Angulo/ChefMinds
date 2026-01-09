
export interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  cookingTime: string;
  difficulty: string;
  calories: string;
}

export interface MealSuggestion {
  recipe: Recipe;
  imagePrompt: string;
}
