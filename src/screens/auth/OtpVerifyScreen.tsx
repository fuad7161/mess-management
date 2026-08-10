import React, {useState} from 'react';
import {confirmOtp} from '../../api/authApi';
import {useAuthStore} from '../../store';
import {Button, ErrorText, Field, Heading, Screen} from '../../components/common';

export default function OtpVerifyScreen({route}: any) {
  const confirmation = useAuthStore(state => state.confirmation);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verify = async () => {
    if (!confirmation) return setError('Request a new OTP first');
    setBusy(true); setError(null);
    try {
      const credential = await confirmOtp(confirmation, code);
      if (!credential?.user) throw new Error('OTP could not be verified');
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle={`Code sent to ${route.params.phone}`}>Verify your number</Heading>
    <Field label="6-digit OTP" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
    <ErrorText message={error} />
    <Button title={busy ? 'Verifying…' : 'Verify and continue'} onPress={verify} disabled={busy || code.length !== 6} />
  </Screen>;
}
