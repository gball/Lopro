import { Auth } from '@aws-amplify/auth';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import ArrowBackIcon from '../assets/arrow-back.svg';
import Button from '../components/Button';
import Constants from 'expo-constants';
import jwt_decode from "jwt-decode";
import * as Device from 'expo-device';

export default function Contact({ navigation, user }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [formText, onChangeFormText] = useState('');
  const [isLoading, onLoadingChange] = useState(false);
  const [textInputBorderColor, onTextInputBorderColorChange] = useState('');

  const contactAdmin = async () => {
    if (formText.length == 0) {
      setErrorMessage('Text field is empty.');
      return;
    }
    onLoadingChange(true);

    const body = {
      deviceModelName: Device.modelName,
      deviceName: Device.deviceName,
      message: formText,
      storeAddress: user.storeSelected.address,
      storeEmails: user.storeSelected.emails,
      storeId: user.storeSelected.id,
      storeName: user.storeSelected.name
    };

    await fetch(Constants.expoConfig.aws.gatewayURL.contactTeam, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.statusCode != 200) {
        throw data;
      }
      
      navigation.navigate('Detail');
    })
    .catch((error) => {
      setErrorMessage('There was an error. Please try again.');
      console.log(error);
    });
  };
  
  const onChangeText = (currentTextFieldValue) => {
    onChangeFormText(currentTextFieldValue);

    if (currentTextFieldValue.length.toString() > 0 && errorMessage == 'Text field is empty.') {
      setErrorMessage('');
    }

    if (currentTextFieldValue.length.toString() <= 350 && errorMessage == 'Maximum characters of 350 reached.') {
      setErrorMessage('');
    }

    if (currentTextFieldValue.length.toString() >= 350) {
      setErrorMessage('Maximum characters of 350 reached.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowBackIcon} onPress={() => { navigation.navigate('Detail') }}>
          <ArrowBackIcon/>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact</Text>
      </View>
      <Text style={styles.containerText}>How may we help?</Text>
      <TextInput
        maxLength={350}
        multiline={true}
        onChangeText={textFieldValue => onChangeText(textFieldValue)}
        onFocus={() => {onTextInputBorderColorChange('#7FC803');}}
        placeholder='Please ask any questions and/or provide any feedback. Our team will get back to you promptly.'
        placeholderTextColor='#9C9C9C'
        selectionColor={'#7FC803'}
        style={[styles.textArea, {borderColor: textInputBorderColor}]}
        value={formText}
      />
      { errorMessage.length > 0 &&
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      }
      <View style={styles.buttonContainer}>
        <Button styleOverride={styles.buttonWhite} children={'Cancel'} onPress={() => { navigation.navigate('Detail') }}/>
        <Button styleOverride={styles.button} children={'Submit'}  onPress={() => { contactAdmin() }} isLoading={isLoading}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrowBackIcon: {
    left: 0,
    position: 'absolute'
  },
  button: { 
    height: 40,
    width: '48%'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18
  },
  buttonWhite: {
    backgroundColor: '#FFFFFF',
    color: '#7FC803',
    height: 40,
    width: '48%'
  },
  container: {
    paddingTop: '10%',
    height: '100%',
    width: '90%',
    left: '5%'
  },
  containerText: {
    fontSize: 16,
    paddingBottom: 12,
    paddingTop: 12
  },
  errorMessage: {
    color: '#F56969',
    fontWeight: '500',
    paddingTop: 12,
    width: '90%'
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '5%',
    justifyContent: 'center',
    marginTop: '2.5%',
    marginBottom: '2.5%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500'
  },
  textArea: {
    borderRadius: 7,
    borderWidth: 1,
    height: '35%',
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12
  }
});
