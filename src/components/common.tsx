import React, {PropsWithChildren} from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TextInputProps, View,
} from 'react-native';

export const Screen = ({children, scroll = true}: PropsWithChildren<{scroll?: boolean}>) => {
  const content = <View style={styles.screen}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
};

export const Heading = ({children, subtitle}: PropsWithChildren<{subtitle?: string}>) => <View style={styles.headingWrap}>
  <Text style={styles.heading}>{children}</Text>
  {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
</View>;

export const Card = ({children}: PropsWithChildren) => <View style={styles.card}>{children}</View>;

export const Field = ({label, ...props}: TextInputProps & {label: string}) => <View style={styles.fieldWrap}>
  <Text style={styles.label}>{label}</Text>
  <TextInput placeholderTextColor="#8793a5" style={styles.input} {...props} />
</View>;

export const Button = ({title, onPress, disabled, tone = 'primary'}: {title: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'danger' | 'secondary'}) =>
  <Pressable disabled={disabled} onPress={onPress} style={[styles.button, styles[`${tone}Button`], disabled && styles.disabled]}>
    <Text style={[styles.buttonText, tone === 'secondary' && styles.secondaryText]}>{title}</Text>
  </Pressable>;

export const Loader = () => <View style={styles.center}><ActivityIndicator size="large" color="#22577a" /></View>;
export const ErrorText = ({message}: {message: string | null}) => message ? <Text style={styles.error}>{message}</Text> : null;

export const WarningBanner = ({admins, members}: {admins: number; members: number}) => {
  if (admins >= 2) return null;
  const message = members < 2
    ? 'Add at least one more member to activate this group.'
    : 'Promote a member to admin so entries can be verified.';
  return <View style={styles.warning}><Text style={styles.warningText}>⚠ {message}</Text></View>;
};

export const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f4f7fb'},
  screen: {padding: 18, gap: 14, flexGrow: 1},
  headingWrap: {marginBottom: 4},
  heading: {fontSize: 27, lineHeight: 34, fontWeight: '800', color: '#17324d'},
  muted: {fontSize: 14, color: '#66768a', marginTop: 4},
  card: {backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 8},
  fieldWrap: {gap: 6}, label: {fontWeight: '700', color: '#32465a'},
  input: {borderWidth: 1, borderColor: '#cad4df', backgroundColor: '#fff', color: '#172b3d', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 16},
  button: {borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center'},
  primaryButton: {backgroundColor: '#22577a'}, dangerButton: {backgroundColor: '#b42318'}, secondaryButton: {backgroundColor: '#e8f1f7'},
  buttonText: {color: '#fff', fontWeight: '800'}, secondaryText: {color: '#22577a'}, disabled: {opacity: 0.45},
  center: {flex: 1, minHeight: 200, justifyContent: 'center', alignItems: 'center'},
  error: {color: '#b42318', fontWeight: '600'},
  warning: {padding: 13, borderRadius: 10, backgroundColor: '#fff4d6', borderColor: '#f0c36a', borderWidth: 1},
  warningText: {color: '#724c00', fontWeight: '700'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  title: {fontSize: 17, fontWeight: '800', color: '#17324d'},
  value: {fontSize: 23, fontWeight: '800', color: '#22577a'},
});
