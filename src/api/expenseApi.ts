import {callable, fbStorage} from './firebase';
import {EntryStatus, ExpenseType} from '../types/expense';

export interface SubmitEntryInput {
  groupId: string;
  type: ExpenseType | 'payment';
  amount: number;
  date: string;
  note?: string;
  method?: string;
  receiptUrl?: string;
}

export const submitExpense = callable<SubmitEntryInput, {expenseId: string}>('submitExpense');
export const approveExpense = callable<{
  groupId: string;
  expenseId: string;
  entryType: ExpenseType | 'payment';
  decision: Exclude<EntryStatus, 'pending'>;
}, {success: true}>('approveExpense');
export const manualExpenseEntry = callable<SubmitEntryInput & {onBehalfOfUid: string}, {expenseId: string}>('manualExpenseEntry');

export const uploadReceipt = async (groupId: string, uid: string, uri: string, contentType = 'image/jpeg') => {
  const uploadId = `${uid}-${Date.now()}`;
  const reference = fbStorage.ref(`receipts/${groupId}/${uploadId}/receipt.jpg`);
  await reference.putFile(uri, {contentType, customMetadata: {uploaderUid: uid}});
  return reference.getDownloadURL();
};
