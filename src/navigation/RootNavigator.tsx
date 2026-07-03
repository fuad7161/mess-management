import React from 'react';
import { View, Text } from 'react-native';

const RootNavigator = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Welcome to Mess App</Text>
      <Text style={{ marginTop: 10 }}>Project architecture initialized successfully!</Text>
    </View>
  );
};

export default RootNavigator;
