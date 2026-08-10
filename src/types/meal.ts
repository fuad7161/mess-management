import {MealWeights} from './group';

export interface MealEntry {
  id: string;
  uid: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  guestMeals: number;
  weightsUsedSnapshot: MealWeights;
}
