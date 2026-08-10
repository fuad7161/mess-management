import React, {useEffect, useState} from 'react';
import {Alert, Pressable, Switch, Text, View} from 'react-native';
import {setMealEntry} from '../../api/mealApi';
import {useMealSheet} from '../../hooks/useMealSheet';
import {useAuthStore, useGroupStore} from '../../store';
import {currentMonthKey, displayDate, toDateKey} from '../../utils/dateHelpers';
import {mealUnits} from '../../utils/calculations';
import {Button, Card, Field, Heading, Screen, styles} from '../../components/common';

export default function MealSheetScreen() {
  const profile = useAuthStore(state => state.profile);
  const group = useGroupStore(state => state.group);
  const members = useGroupStore(state => state.members);
  const [filterUid, setFilterUid] = useState<string | undefined>();
  const entries = useMealSheet(group?.id, currentMonthKey(), filterUid);
  const ownEntries = useMealSheet(group?.id, currentMonthKey(), profile?.uid);
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const selected = ownEntries.find(item => item.date === selectedDate);
  const [values, setValues] = useState({breakfast: false, lunch: false, dinner: false, guestMeals: 0});
  useEffect(() => setValues(selected ? {breakfast: selected.breakfast, lunch: selected.lunch, dinner: selected.dinner, guestMeals: selected.guestMeals} : {breakfast: false, lunch: false, dinner: false, guestMeals: 0}), [selected?.id, selected?.breakfast, selected?.lunch, selected?.dinner, selected?.guestMeals]);
  if (!group || !profile) return null;
  const save = () => setMealEntry(group.id, profile.uid, selectedDate, values, group.mealWeights).catch(error => Alert.alert('Could not save meals', String(error)));
  return <Screen>
    <Heading subtitle={`${currentMonthKey()} · tap a member to filter`}>Meal Sheet</Heading>
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7}}>
      <Pressable onPress={() => setFilterUid(undefined)}><Text style={{color: !filterUid ? '#22577a' : '#66768a', fontWeight: '800'}}>All</Text></Pressable>
      {members.map(member => <Pressable key={member.uid} onPress={() => setFilterUid(member.uid)}><Text style={{color: filterUid === member.uid ? '#22577a' : '#66768a'}}>{member.name ?? member.uid.slice(0, 5)}</Text></Pressable>)}
    </View>
    <Card><Text style={styles.title}>Edit your meals</Text><Field label="Date (YYYY-MM-DD)" value={selectedDate} onChangeText={setSelectedDate} />{(['breakfast', 'lunch', 'dinner'] as const).map(slot => <View key={slot} style={styles.rowBetween}><Text style={{textTransform: 'capitalize'}}>{slot}</Text><Switch value={values[slot]} onValueChange={value => setValues(current => ({...current, [slot]: value}))} /></View>)}
      <View style={styles.rowBetween}><Text>Guest meals: {values.guestMeals}</Text><View style={styles.row}><Button title="−" tone="secondary" onPress={() => setValues(current => ({...current, guestMeals: Math.max(0, current.guestMeals - 1)}))} /><Button title="+" tone="secondary" onPress={() => setValues(current => ({...current, guestMeals: current.guestMeals + 1}))} /></View></View>
      <Button title="Save meals" onPress={save} disabled={!selectedDate.startsWith(currentMonthKey())} />
    </Card>
    {entries.map(entry => <Card key={entry.id}><View style={styles.rowBetween}><Text style={styles.title}>{displayDate(entry.date)}</Text><Text>{mealUnits(entry, group.mealWeights).toFixed(1)} meals</Text></View><Text>{members.find(member => member.uid === entry.uid)?.name ?? entry.uid.slice(0, 7)}</Text><Text style={styles.muted}>{entry.breakfast ? 'Breakfast  ' : ''}{entry.lunch ? 'Lunch  ' : ''}{entry.dinner ? 'Dinner  ' : ''}{entry.guestMeals ? `+ ${entry.guestMeals} guest` : ''}</Text></Card>)}
  </Screen>;
}
