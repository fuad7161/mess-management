import firestore from '@react-native-firebase/firestore';
import {mealsCol, monthlySummaryCol} from './firebase';
import {MealWeights} from '../types/group';

export const setMealEntry = async (
  groupId: string,
  uid: string,
  date: string,
  values: {breakfast: boolean; lunch: boolean; dinner: boolean; guestMeals: number},
  weights: MealWeights,
) => {
  const summary = await monthlySummaryCol(groupId).doc(date.slice(0, 7)).get();
  if (summary.data()?.finalized || summary.data()?.closing) throw new Error('This month has already been finalized or is being finalized');
  return mealsCol(groupId).doc(`${uid}_${date}`).set({
    uid, date, ...values, weightsUsedSnapshot: weights,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
};
