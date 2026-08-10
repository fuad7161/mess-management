import React, {useState} from 'react';
import {Alert, Text} from 'react-native';
import {cancelJoinRequest} from '../../api/groupApi';
import {signOut} from '../../api/authApi';
import {useAuthStore} from '../../store';
import {Button, Card, Heading, Screen, styles} from '../../components/common';

export default function NoGroupScreen({navigation}: any) {
  const profile = useAuthStore(state => state.profile);
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    if (!profile?.pendingGroupId) return;
    setBusy(true);
    try { await cancelJoinRequest({groupId: profile.pendingGroupId}); }
    catch (error) { Alert.alert('Could not cancel', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle={`Welcome, ${profile?.name ?? 'member'}`}>Choose your mess</Heading>
    {profile?.pendingGroupId ? <Card>
      <Text style={styles.title}>Request pending</Text>
      <Text>Request to join {profile.pendingGroupName ?? 'the selected group'} — Pending approval</Text>
      <Button title={busy ? 'Cancelling…' : 'Cancel request'} tone="danger" onPress={cancel} disabled={busy} />
    </Card> : <>
      <Card><Text style={styles.title}>Join an existing mess</Text><Text style={styles.muted}>Search by name and request approval from its admins.</Text><Button title="Search groups" onPress={() => navigation.navigate('SearchGroup')} /></Card>
      <Card><Text style={styles.title}>Start a new mess</Text><Text style={styles.muted}>You become the first admin and can invite your housemates.</Text><Button title="Create new group" tone="secondary" onPress={() => navigation.navigate('CreateGroup')} /></Card>
    </>}
    <Button title="Sign out" tone="secondary" onPress={() => signOut()} />
  </Screen>;
}
