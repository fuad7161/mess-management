export type EntryStatus = 'pending' | 'approved' | 'rejected';
export type ExpenseType = 'bazar' | 'extraCost';

export interface FinancialEntry {
  id: string;
  submittedBy: string;
  submitterName?: string;
  amount: number;
  date: string;
  note: string | null;
  status: EntryStatus;
  approvedBy: string | null;
  approvedAt?: unknown;
  createdAt?: unknown;
}

export interface Expense extends FinancialEntry {
  type: ExpenseType;
  receiptUrl: string | null;
}

export interface Payment extends FinancialEntry {
  method: string | null;
}

export interface MemberSummary {
  meals: number;
  bazarCost: number;
  extraCost: number;
  paid: number;
  due: number;
}

export interface MonthlySummary {
  month: string;
  totalBazar: number;
  totalExtraCost: number;
  totalPayments: number;
  totalMeals: number;
  mealRate: number;
  extraCostPerMember: number;
  memberCountForExtraCost: number;
  perMemberBreakdown: Record<string, MemberSummary>;
  finalized: boolean;
}
