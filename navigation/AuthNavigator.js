import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgetPasswordScreen from '../screens/authentication/ForgetPassword';
import React from 'react';
import SignInScreen from '../screens/authentication/SignIn';

export default function AuthNavigator({ signIn }) {
  const AuthStack = createNativeStackNavigator();
  const AuthModalStack = createNativeStackNavigator();

  return(
  <AuthModalStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthModalStack.Screen name="AuthPages">
      {() => (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn">
            {({ navigation }) => <SignInScreen signIn={signIn} navigation={navigation} />}
          </AuthStack.Screen>
          <AuthStack.Screen name="ForgetPassword" component={ForgetPasswordScreen}/>
        </AuthStack.Navigator>
      )}
    </AuthModalStack.Screen>
  </AuthModalStack.Navigator>
  );
}
