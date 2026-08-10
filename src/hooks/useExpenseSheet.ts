import {useEffect, useState} from 'react';
import {expensesCol, paymentsCol} from '../api/firebase';
import {Expense, ExpenseType, Payment} from '../types/expense';
import {monthBounds} from '../utils/dateHelpers';

export const useExpenseSheet = (groupId: string | undefined, month: string, type: ExpenseType | 'payment') => {
  const [entries, setEntries] = useState<Array<Expense | Payment>>([]);
  useEffect(() => {
    if (!groupId) return;
    const {start, end} = monthBounds(month);
    let query = (type === 'payment' ? paymentsCol(groupId) : expensesCol(groupId))
      .where('date', '>=', start).where('date', '<=', end);
    if (type !== 'payment') query = query.where('type', '==', type);
    return query.orderBy('date', 'desc').onSnapshot(snapshot =>
      setEntries(snapshot.docs.map(item => ({id: item.id, ...item.data()} as Expense | Payment))),
    );
  }, [groupId, month, type]);
  return entries;
};
