import React, {useState} from 'react';
import {Alert, Text} from 'react-native';
import {findGroups, requestToJoinGroup} from '../../api/groupApi';
import {Group} from '../../types/group';
import {Button, Card, Field, Heading, Screen, styles} from '../../components/common';

export default function SearchGroupScreen({navigation}: any) {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const search = async () => {
    setBusy(true);
    try { setGroups(await findGroups(query)); }
    catch (error) { Alert.alert('Search failed', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  const request = async (group: Group) => {
    setBusy(true);
    try { await requestToJoinGroup({groupId: group.id}); navigation.popToTop(); }
    catch (error) { Alert.alert('Request failed', error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle="Search uses the beginning of the mess name.">Find a mess</Heading>
    <Field label="Mess name" value={query} onChangeText={setQuery} onSubmitEditing={search} />
    <Button title={busy ? 'Please wait…' : 'Search'} onPress={search} disabled={busy || !query.trim()} />
    {groups.map(group => <Card key={group.id}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.muted}>{group.description || 'No description'} · {group.memberCount} member(s)</Text>
      <Button title="Request to join" onPress={() => request(group)} disabled={busy} />
    </Card>)}
    {!busy && query && !groups.length ? <Text style={styles.muted}>No matching active groups.</Text> : null}
  </Screen>;
}
