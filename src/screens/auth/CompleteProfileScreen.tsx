import React, {useState} from 'react';
import {createUserProfile, signOut} from '../../api/authApi';
import {Button, ErrorText, Field, Heading, Screen} from '../../components/common';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError(null);
    try { await createUserProfile({name: name.trim()}); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle="This is the name your mess members will see.">Complete your profile</Heading>
    <Field label="Your name" value={name} onChangeText={setName} autoCapitalize="words" />
    <ErrorText message={error} />
    <Button title={busy ? 'Saving…' : 'Continue'} onPress={save} disabled={busy || !name.trim()} />
    <Button title="Sign out" tone="secondary" onPress={signOut} />
  </Screen>;
}
