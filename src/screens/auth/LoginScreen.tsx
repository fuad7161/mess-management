import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {sendOtp} from '../../api/authApi';
import {useAuthStore} from '../../store';
import {normalizePhone} from '../../utils/validators';
import {Button, ErrorText, Field, Heading, Screen} from '../../components/common';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const setConfirmation = useAuthStore(state => state.setConfirmation);
  const [phone, setPhone] = useState('+880');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const normalized = normalizePhone(phone);
      const confirmation = await sendOtp(normalized);
      setConfirmation(confirmation);
      navigation.navigate('OtpVerify', {phone: normalized});
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Heading subtitle="Use your phone number to securely access your mess.">Mess Manager</Heading>
    <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <ErrorText message={error} />
    <Button title={busy ? 'Sending OTP…' : 'Send OTP'} onPress={submit} disabled={busy || phone.length < 8} />
  </Screen>;
}
