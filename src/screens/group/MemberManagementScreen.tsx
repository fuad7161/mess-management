import React, {useState} from 'react';
import {Alert, Text, View} from 'react-native';
import {demoteFromAdmin, promoteToAdmin} from '../../api/groupApi';
import {useAuthStore, useGroupStore} from '../../store';
import {Button, Card, Heading, Screen, styles} from '../../components/common';

export default function MemberManagementScreen() {
  const group = useGroupStore(state => state.group);
  const members = useGroupStore(state => state.members);
  const uid = useAuthStore(state => state.profile?.uid);
  const [busy, setBusy] = useState<string | null>(null);
  const changeRole = async (targetUid: string, promote: boolean) => {
    if (!group) return;
    setBusy(targetUid);
    try { await (promote ? promoteToAdmin({groupId: group.id, targetUid}) : demoteFromAdmin({groupId: group.id, targetUid})); }
    catch (error) { Alert.alert('Role change failed', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(null); }
  };
  return <Screen><Heading subtitle="At least one admin must always remain.">Members</Heading>
    {members.map(member => <Card key={member.uid}>
      <View style={styles.rowBetween}><View><Text style={styles.title}>{member.name ?? member.uid}</Text><Text style={styles.muted}>{member.phone ?? ''} · {member.role}</Text></View>
      {member.uid !== uid ? <Button title={member.role === 'admin' ? 'Demote' : 'Promote'} tone="secondary" disabled={busy === member.uid} onPress={() => changeRole(member.uid, member.role !== 'admin')} /> : null}</View>
    </Card>)}
  </Screen>;
}
