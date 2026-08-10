import React from 'react';
import {Text, View} from 'react-native';
import {useMonthlySummary} from '../../hooks/useMonthlySummary';
import {useAuthStore, useGroupStore} from '../../store';
import {currentMonthKey} from '../../utils/dateHelpers';
import {money} from '../../utils/calculations';
import {Button, Card, Heading, Loader, Screen, WarningBanner, styles} from '../../components/common';

export default function DashboardScreen({navigation}: any) {
  const profile = useAuthStore(state => state.profile);
  const group = useGroupStore(state => state.group);
  const role = useGroupStore(state => state.myRole);
  const members = useGroupStore(state => state.members);
  const {summary, loading} = useMonthlySummary(group?.id, currentMonthKey());
  if (!group || loading) return <Loader />;
  const own = profile ? summary?.perMemberBreakdown?.[profile.uid] : undefined;
  return <Screen>
    <Heading subtitle={`${currentMonthKey()} · ${members.length} active member(s)`}>{group.name}</Heading>
    <WarningBanner admins={group.adminCount} members={group.memberCount} />
    <View style={styles.row}>
      <View style={{flex: 1}}><Card><Text style={styles.muted}>Meal rate</Text><Text style={styles.value}>{money(summary?.mealRate ?? 0)}</Text></Card></View>
      <View style={{flex: 1}}><Card><Text style={styles.muted}>Your balance</Text><Text style={styles.value}>{money(own?.due ?? 0)}</Text><Text style={styles.muted}>{(own?.due ?? 0) >= 0 ? 'Due' : 'Advance'}</Text></Card></View>
    </View>
    <Card><Text style={styles.title}>Group totals</Text><Text>Bazar: {money(summary?.totalBazar ?? 0)}</Text><Text>Payments: {money(summary?.totalPayments ?? 0)}</Text><Text>Extra cost: {money(summary?.totalExtraCost ?? 0)}</Text><Text>Total meals: {(summary?.totalMeals ?? 0).toFixed(1)}</Text></Card>
    <Card><Text style={styles.title}>Member standing</Text>{members.map(member => {
      const value = summary?.perMemberBreakdown?.[member.uid];
      return <View key={member.uid} style={styles.rowBetween}><Text>{member.name ?? member.uid.slice(0, 7)} {member.role === 'admin' ? '★' : ''}</Text><Text>{money(value?.due ?? 0)}</Text></View>;
    })}</Card>
    {role === 'admin' ? <>
      <Button title="Review join requests" onPress={() => navigation.navigate('JoinRequests')} />
      <Button title="Manage members" tone="secondary" onPress={() => navigation.navigate('Members')} />
      <Button title="Group settings" tone="secondary" onPress={() => navigation.navigate('GroupSettings')} />
    </> : null}
  </Screen>;
}
