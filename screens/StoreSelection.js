import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'expo-camera';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NextIcon from '../assets/next.svg';
import React, { useEffect, useState } from 'react';

export default function StoreSelection({ navigation, user }) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [storeLocations, setStoreLocations] = useState([]);

  const handleStorePressed = async (store) => {
    AsyncStorage.setItem('preferredDeviceStoreLocation', JSON.stringify(store));
    user.preferredDeviceStoreLocation = store;
    user.storeSelected = store;
    navigation.navigate('Detail');
  };

  useEffect(() => {
    if (permission != null) {
      if (permission.canAskAgain && !permission.granted) {
        requestPermission();
      }
    }

    setStoreLocations(user.storeList)
  },[permission]);

  const renderStoreLocations = ({ item, index }) => {
    let styling = styles.option;
    if (index == 0) {
      styling = [styles.option, styles.first];
    } else if (index == user.storeList.length - 1) {
      styling = [styles.option, styles.last];
    }

    return(
      <TouchableOpacity style={styling} onPress={() => { handleStorePressed(item) }}>
        <View>
          <Text style={styles.optionTitle}>{item.name}</Text>
          <Text style={styles.optionSubText}>{item.address}</Text>
        </View>
        <NextIcon/>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's Scanning?</Text>
      <FlatList 
        data={storeLocations} 
        renderItem={renderStoreLocations} 
        keyExtractor={item => item.id}
        style={styles.optionContainer} 
        showsVerticalScrollIndicator={false}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    height: '85%',
    justifyContent: 'flex-start',
    marginLeft: '10%',
    paddingTop: '25%',
    width: '80%'
  },
  first: {
    borderTopWidth: 0.5
  },
  last: {
    borderBottomWidth: 0.5
  },
  option: {
    alignItems: 'center',
    borderBottomWidth: 0.25,
    borderTopWidth: 0.25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 18,
    paddingLeft: 12,
    paddingRight: 12
  },
  optionContainer: {
    width: '100%'
  },
  optionSubText: {
    fontSize: 14,
    paddingTop: 6
  },
  optionTitle: {
    fontSize: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: '10%'
  }
});
