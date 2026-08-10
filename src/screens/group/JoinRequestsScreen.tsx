import React, {useEffect, useState} from 'react';
import {Alert, Text, View} from 'react-native';
import {joinRequestsCol, usersCol} from '../../api/firebase';
import {respondToJoinRequest} from '../../api/groupApi';
import {useGroupStore} from '../../store';
import {JoinRequest} from '../../types/group';
import {Button, Card, Heading, Screen, styles} from '../../components/common';

export default function JoinRequestsScreen() {
  const group = useGroupStore(state => state.group);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!group) return;
    return joinRequestsCol(group.id).where('status', '==', 'pending').onSnapshot(async snapshot => {
      const values = await Promise.all(snapshot.docs.map(async item => {
        const user = await usersCol().doc(item.id).get();
        return {uid: item.id, ...item.data(), name: user.data()?.name} as JoinRequest;
      }));
      setRequests(values);
    });
  }, [group]);
  const respond = async (requestUid: string, decision: 'approve' | 'reject') => {
    if (!group) return;
    setBusy(requestUid);
    try { await respondToJoinRequest({groupId: group.id, requestUid, decision}); }
    catch (error) { Alert.alert('Could not respond', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(null); }
  };
  return <Screen><Heading>Pending requests</Heading>
    {!requests.length ? <Card><Text style={styles.muted}>There are no pending requests.</Text></Card> : requests.map(request => <Card key={request.uid}>
      <Text style={styles.title}>{request.name ?? request.uid}</Text><View style={styles.row}>
        <View style={{flex: 1}}><Button title="Approve" disabled={busy === request.uid} onPress={() => respond(request.uid, 'approve')} /></View>
        <View style={{flex: 1}}><Button title="Reject" tone="danger" disabled={busy === request.uid} onPress={() => respond(request.uid, 'reject')} /></View>
      </View>
    </Card>)}
  </Screen>;
}
