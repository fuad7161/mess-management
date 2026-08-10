import {useEffect, useState} from 'react';
import {mealsCol} from '../api/firebase';
import {monthBounds} from '../utils/dateHelpers';
import {MealEntry} from '../types/meal';

export const useMealSheet = (groupId: string | undefined, month: string, uid?: string) => {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  useEffect(() => {
    if (!groupId) return;
    const {start, end} = monthBounds(month);
    let query = mealsCol(groupId).where('date', '>=', start).where('date', '<=', end);
    if (uid) query = query.where('uid', '==', uid);
    return query.orderBy('date', 'desc').onSnapshot(snapshot =>
      setEntries(snapshot.docs.map(item => ({id: item.id, ...item.data()} as MealEntry))),
    );
  }, [groupId, month, uid]);
  return entries;
};
