export interface Breakdown {meals: number; bazarCost: number; extraCost: number; paid: number; due: number}

export const calculateBreakdown = (
  mealTotals: Record<string, number>,
  payments: Record<string, number>,
  totalBazar: number,
  totalExtraCost: number,
  memberIds: string[],
) => {
  const totalMeals = Object.values(mealTotals).reduce((sum, value) => sum + value, 0);
  const mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;
  const extraCostPerMember = memberIds.length ? totalExtraCost / memberIds.length : 0;
  const ids = new Set([...memberIds, ...Object.keys(mealTotals), ...Object.keys(payments)]);
  const perMemberBreakdown: Record<string, Breakdown> = {};
  ids.forEach(uid => {
    const meals = mealTotals[uid] ?? 0;
    const paid = payments[uid] ?? 0;
    const extraCost = memberIds.includes(uid) ? extraCostPerMember : 0;
    const bazarCost = meals * mealRate;
    perMemberBreakdown[uid] = {meals, paid, extraCost, bazarCost, due: bazarCost + extraCost - paid};
  });
  return {totalMeals, mealRate, extraCostPerMember, perMemberBreakdown};
};
