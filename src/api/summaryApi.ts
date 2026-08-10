import {callable, monthlySummaryCol} from './firebase';
import {MonthlySummary} from '../types/expense';

export const getGroupSummary = callable<{groupId: string; month: string}, MonthlySummary>('getGroupSummary');
export const finalizeMonth = callable<{groupId: string; month: string}, {success: true}>('finalizeMonth');
export const summaryRef = (groupId: string, month: string) => monthlySummaryCol(groupId).doc(month);
