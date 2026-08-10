import React, {useState} from 'react';
import {createGroup} from '../../api/groupApi';
import {Button, ErrorText, Field, Heading, Screen} from '../../components/common';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = async () => {
    setBusy(true); setError(null);
    try { await createGroup({name: name.trim(), description: description.trim() || undefined, location: location.trim() || undefined}); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle="Financial entries unlock after a second admin is promoted.">Create a mess</Heading>
    <Field label="Mess name" value={name} onChangeText={setName} />
    <Field label="Description (optional)" value={description} onChangeText={setDescription} />
    <Field label="Location (optional)" value={location} onChangeText={setLocation} />
    <ErrorText message={error} />
    <Button title={busy ? 'Creating…' : 'Create group'} onPress={create} disabled={busy || !name.trim()} />
  </Screen>;
}
