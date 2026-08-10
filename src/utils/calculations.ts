import {MealEntry} from '../types/meal';
import {MealWeights} from '../types/group';

export const mealUnits = (meal: Partial<MealEntry>, fallback: MealWeights) => {
  const weights = meal.weightsUsedSnapshot ?? fallback;
  return (meal.breakfast ? weights.breakfast : 0) +
    (meal.lunch ? weights.lunch : 0) +
    (meal.dinner ? weights.dinner : 0) +
    Number(meal.guestMeals ?? 0);
};

export const money = (value = 0) => `৳${value.toFixed(2)}`;
