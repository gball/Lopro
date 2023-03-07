import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Contact from '../screens/Contact';
import Detail from '../screens/Detail';
import React from 'react';
import StoreSelection from '../screens/StoreSelection';

export default function AppNavigator({ user, signOut }) {
  const AppStack = createNativeStackNavigator();
  const initialRouteName = user.preferredDeviceStoreLocation == null && user.storeList.length > 1 ? 'StoreSelection': 'Detail';

  return(
    <AppStack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Contact">
        {({ navigation }) => <Contact navigation={navigation} user={user}/>}
      </AppStack.Screen>
      <AppStack.Screen name="Detail">
        {({ navigation }) => <Detail navigation={navigation} signOut={signOut} user={user}/>}
      </AppStack.Screen>
      <AppStack.Screen name="StoreSelection">
        {({ navigation }) => <StoreSelection navigation={navigation} user={user}/>}
      </AppStack.Screen>
    </AppStack.Navigator>
  );
}
