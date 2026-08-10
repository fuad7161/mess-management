import React, {useState} from 'react';
import {Alert, Text} from 'react-native';
import {deleteGroup, leaveGroup, updateMealWeights} from '../../api/groupApi';
import {finalizeMonth} from '../../api/summaryApi';
import {signOut} from '../../api/authApi';
import {useGroupStore} from '../../store';
import {currentMonthKey} from '../../utils/dateHelpers';
import {Button, Card, Field, Heading, Screen, styles} from '../../components/common';

export default function GroupSettingsScreen() {
  const group = useGroupStore(state => state.group);
  const role = useGroupStore(state => state.myRole);
  const [breakfast, setBreakfast] = useState(String(group?.mealWeights.breakfast ?? 0.5));
  const [lunch, setLunch] = useState(String(group?.mealWeights.lunch ?? 1));
  const [dinner, setDinner] = useState(String(group?.mealWeights.dinner ?? 1));
  if (!group) return null;
  const saveWeights = async () => {
    try { await updateMealWeights({groupId: group.id, breakfast: Number(breakfast), lunch: Number(lunch), dinner: Number(dinner)}); Alert.alert('Saved', 'New weights apply to future meal entries.'); }
    catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : String(error)); }
  };
  const confirmDelete = () => Alert.alert('Delete group?', 'This archives the group and removes all current members. Historical data is retained.', [{text: 'Cancel'}, {text: 'Delete', style: 'destructive', onPress: () => deleteGroup({groupId: group.id}).catch(error => Alert.alert('Delete failed', String(error)))}]);
  return <Screen><Heading>{group.name}</Heading>
    {role === 'admin' ? <Card><Text style={styles.title}>Meal weights</Text><Field label="Breakfast" value={breakfast} onChangeText={setBreakfast} keyboardType="decimal-pad" /><Field label="Lunch" value={lunch} onChangeText={setLunch} keyboardType="decimal-pad" /><Field label="Dinner" value={dinner} onChangeText={setDinner} keyboardType="decimal-pad" /><Button title="Save weights" onPress={saveWeights} /></Card> : null}
    {role === 'admin' ? <Button title={`Finalize ${currentMonthKey()}`} onPress={() => finalizeMonth({groupId: group.id, month: currentMonthKey()}).then(() => Alert.alert('Month finalized')).catch(error => Alert.alert('Could not finalize', String(error)))} /> : null}
    <Button title="Leave group" tone="secondary" onPress={() => leaveGroup({groupId: group.id}).catch(error => Alert.alert('Could not leave', String(error)))} />
    {role === 'admin' ? <Button title="Delete group" tone="danger" onPress={confirmDelete} /> : null}
    <Button title="Sign out" tone="secondary" onPress={signOut} />
  </Screen>;
}
