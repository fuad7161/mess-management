import React, {useState} from 'react';
import {Alert} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {manualExpenseEntry, submitExpense, uploadReceipt} from '../api/expenseApi';
import {useAuthStore, useGroupStore} from '../store';
import {ExpenseType} from '../types/expense';
import {toDateKey} from '../utils/dateHelpers';
import {validAmount, validDate} from '../utils/validators';
import {Button, ErrorText, Field, Heading, Screen} from './common';

export const EntryForm = ({type, title, onDone, manual = false}: {type: ExpenseType | 'payment'; title: string; onDone: () => void; manual?: boolean}) => {
  const group = useGroupStore(state => state.group);
  const members = useGroupStore(state => state.members);
  const uid = useAuthStore(state => state.profile?.uid);
  const eligibleMembers = members.filter(member => member.uid !== uid);
  const [onBehalfOfUid, setOnBehalfOfUid] = useState(eligibleMembers[0]?.uid ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateKey());
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('cash');
  const [receipt, setReceipt] = useState<{uri: string; mimeType?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const message = validAmount(amount) || validDate(date);
    if (message || !group) return setError(message ?? 'Group not available');
    setBusy(true); setError(null);
    try {
      const receiptUrl = receipt && uid ? await uploadReceipt(group.id, uid, receipt.uri, receipt.mimeType) : undefined;
      const input = {groupId: group.id, type, amount: Number(amount), date, note: note.trim() || undefined, method: type === 'payment' ? method : undefined, receiptUrl};
      if (manual) {
        if (!onBehalfOfUid) throw new Error('Choose another member');
        await manualExpenseEntry({...input, onBehalfOfUid});
      } else await submitExpense(input);
      onDone();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      setError(messageText); Alert.alert('Submission failed', messageText);
    } finally { setBusy(false); }
  };
  const pickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError('Photo library permission is required to attach a receipt');
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ['images'], quality: 0.7, allowsEditing: true});
    if (!result.canceled) setReceipt({uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? undefined});
  };
  return <Screen>
    <Heading subtitle="Entries remain pending until another admin verifies them.">{title}</Heading>
    {manual ? <><Field label="On behalf of member UID" value={onBehalfOfUid} onChangeText={setOnBehalfOfUid} /><Field label="Available members" value={eligibleMembers.map(member => `${member.name ?? member.uid}: ${member.uid}`).join('\n')} editable={false} multiline /></> : null}
    <Field label="Amount (BDT)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
    <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
    {type === 'payment' ? <Field label="Method" value={method} onChangeText={setMethod} /> : null}
    {type === 'bazar' ? <Button title={receipt ? '✓ Receipt selected' : 'Attach receipt (optional)'} tone="secondary" onPress={pickReceipt} /> : null}
    <Field label="Note (optional)" value={note} onChangeText={setNote} multiline />
    <ErrorText message={error} />
    <Button title={busy ? 'Submitting…' : 'Submit for verification'} onPress={submit} disabled={busy} />
    <Button title="Cancel" tone="secondary" onPress={onDone} />
  </Screen>;
};
