import { Amplify } from "aws-amplify";
import { Auth } from '@aws-amplify/auth';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { ToastProvider } from 'react-native-toast-notifications';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './aws-exports';
import Constants from 'expo-constants';
import React from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userToken: null,
      user: null
    };
    this.signOut = this.signOut.bind(this);
    this.signIn = this.signIn.bind(this);
  }

  async componentDidMount() {
    await SplashScreen.preventAutoHideAsync();
    Amplify.configure(config);
    
    let loadAuth = this.loadAuth();
    let loadScratcher = this.loadScratcher();
    let minimum = new Promise(resolve => setTimeout(resolve, 1000));
    let screenLock = ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    await Promise.all([loadAuth, loadScratcher, minimum, screenLock]);
    await SplashScreen.hideAsync();
  }

  async getCusomterInfo(id, token) {
    await fetch(Constants.expoConfig.aws.gatewayURL.customerStores + id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token
      }
    })
    .then((response) => response.json())
    .then(async (data) => {
      if (data.errorMessage) {
        throw data;
      }

      await AsyncStorage.removeItem('customerInfo');
      await AsyncStorage.setItem('customerInfo', JSON.stringify(data));
    })
    .catch((err) => {
      console.log(`Error getting customer info: ${JSON.stringify(err)}`);
    });
  }

  async loadActivePacks(id, token) {
    let body = {
      customerId: id
    };
    await fetch(Constants.expoConfig.aws.gatewayURL.getActivePacks, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then(async (res) => {
      await AsyncStorage.removeItem('activePacks');
      await AsyncStorage.setItem('activePacks', res.data);
    })
    .catch((err) => {
      console.log(err)
      console.log(`Error loading scratcher info: ${JSON.stringify(err)}`);
    });;
  }

  async loadAuth() {
    await Auth.currentAuthenticatedUser()
      .then(async (user) => {
        await this.signIn(user);
      })
      .catch((err) => {
        console.log('Error signing in:', err);
      });
  }

  async loadScratcher() {
    await fetch(Constants.expoConfig.aws.cloudfront.scratchersinfo, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'max-age=3600'
      }
    })
    .then((response) => response.json())
    .then(async (data) => {
      if (data.errorMessage) {
        throw `${data.errorMessage} ${data.trace}`;
      }
      
      await AsyncStorage.removeItem('scratcherValueMap'); 
      await AsyncStorage.setItem('scratcherValueMap', JSON.stringify(data));
    })
    .catch((err) => {
      console.log(`Error loading scratcher info: ${JSON.stringify(err)}`);
    });;
  }

  async signIn(user) {
    await this.getCusomterInfo(user.attributes.sub, user.signInUserSession.idToken.jwtToken);
    await this.loadActivePacks(user.attributes.sub, user.signInUserSession.idToken.jwtToken);
    const customerInfo = JSON.parse(await AsyncStorage.getItem('customerInfo')); 
    const preferredDeviceStoreLocation = JSON.parse(await AsyncStorage.getItem('preferredDeviceStoreLocation'));
    const storeSelected = preferredDeviceStoreLocation != null ? preferredDeviceStoreLocation : customerInfo.storeList[0];
    const userExtrapolated = {
      accessToken: user.signInUserSession.accessToken.jwtToken,
      clientToken: user.signInUserSession.idToken.jwtToken,
      hasPaid: customerInfo.hasPaid,
      id: user.attributes.sub,
      preferredDeviceStoreLocation: preferredDeviceStoreLocation,
      storeList: customerInfo.storeList,
      storeSelected: storeSelected
    };

    this.setState({
      userToken: user.signInUserSession.accessToken.jwtToken,
      user: userExtrapolated
    });
  }

  async signOut() {
    await AsyncStorage.removeItem('preferredDeviceStoreLocation');
    await AsyncStorage.removeItem('customerInfo');
    await AsyncStorage.removeItem('activePacks');
    await Auth.signOut()
      .catch((err) => {
        console.log('ERROR: ', err);
      });
    this.setState({ userToken: null });
  }

  render() {
    if (!this.state.userToken) {
      view = <AuthNavigator signIn={this.signIn} />;
    } else {
      view = <AppNavigator user={this.state.user} signOut={this.signOut} />;
    }

    return(
      <ToastProvider offsetBottom={20} swipeEnabled={true}
        renderType={{
          custom_type: (toast) => (
            <View
              style={{
                width: '90%',
                height: 50,
                backgroundColor: toast.color,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingLeft: 15,
                paddingRight: 15
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{toast.message}</Text>
            </View>
          )
        }}
      >
        <View style={styles.container}>
          <NavigationContainer>
            {view}
          </NavigationContainer>
          <StatusBar style='dark-content' />
        </View>
      </ToastProvider>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default gestureHandlerRootHOC(App);
