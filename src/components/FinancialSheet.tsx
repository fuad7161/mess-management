import React, {useState} from 'react';
import {Alert, Text, View} from 'react-native';
import {approveExpense} from '../api/expenseApi';
import {useExpenseSheet} from '../hooks/useExpenseSheet';
import {useAuthStore, useGroupStore} from '../store';
import {ExpenseType} from '../types/expense';
import {displayDate, currentMonthKey} from '../utils/dateHelpers';
import {money} from '../utils/calculations';
import {Button, Card, Heading, Screen, WarningBanner, styles} from './common';

export const FinancialSheet = ({type, title, onAdd, onManual}: {type: ExpenseType | 'payment'; title: string; onAdd: () => void; onManual?: () => void}) => {
  const group = useGroupStore(state => state.group);
  const role = useGroupStore(state => state.myRole);
  const uid = useAuthStore(state => state.profile?.uid);
  const members = useGroupStore(state => state.members);
  const entries = useExpenseSheet(group?.id, currentMonthKey(), type);
  const [busy, setBusy] = useState<string | null>(null);
  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    if (!group) return;
    setBusy(id);
    try { await approveExpense({groupId: group.id, expenseId: id, entryType: type, decision}); }
    catch (error) { Alert.alert('Could not update entry', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(null); }
  };
  if (!group) return null;
  return <Screen>
    <Heading subtitle={currentMonthKey()}>{title}</Heading>
    <WarningBanner admins={group.adminCount} members={group.memberCount} />
    <Button title={`Add ${title.replace(' Sheet', '')}`} onPress={onAdd} disabled={group.adminCount < 2} />
    {role === 'admin' && onManual ? <Button title="Add on behalf of a member" tone="secondary" onPress={onManual} disabled={group.adminCount < 2} /> : null}
    {!entries.length ? <Card><Text style={styles.muted}>No entries this month.</Text></Card> : entries.map(entry => <Card key={entry.id}>
      <View style={styles.rowBetween}><Text style={styles.title}>{money(entry.amount)}</Text><Text>{entry.status === 'approved' ? '✓ Verified' : entry.status === 'rejected' ? '✕ Rejected' : '⚠ Not verified'}</Text></View>
      <Text>{displayDate(entry.date)} · {members.find(member => member.uid === entry.submittedBy)?.name ?? `Member ${entry.submittedBy.slice(0, 7)}`}</Text>
      {entry.note ? <Text style={styles.muted}>{entry.note}</Text> : null}
      {role === 'admin' && entry.status === 'pending' && entry.submittedBy !== uid ? <View style={styles.row}>
        <View style={{flex: 1}}><Button title="Approve" disabled={busy === entry.id} onPress={() => decide(entry.id, 'approved')} /></View>
        <View style={{flex: 1}}><Button title="Reject" tone="danger" disabled={busy === entry.id} onPress={() => decide(entry.id, 'rejected')} /></View>
      </View> : null}
      {entry.status === 'pending' && entry.submittedBy === uid && role === 'admin' ? <Text style={styles.muted}>Another admin must verify your entry.</Text> : null}
    </Card>)}
  </Screen>;
};
