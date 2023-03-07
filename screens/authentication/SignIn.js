import { Auth } from '@aws-amplify/auth';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import EyeHideIcon from '../../assets/eye-hide.svg';
import EyeShowIcon from '../../assets/eye-show.svg';
import FloatingTitleTextInput from '../../components/FloatingTitleTextInput';
import Logo from '../../assets/logo.svg';
import PropTypes from 'prop-types';
import * as Link from 'expo-linking';

export default function SignIn({ navigation, signIn: signInCb }) {
  const [email, onChangeEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, onLoadingChange] = React.useState(false);
  const [password, onChangePassword] = useState('');

  const signIn = async (signInCb) => {
    onLoadingChange(true);
    setErrorMessage('');

    if (email.length > 4 && password.length > 2) {
      await Auth.signIn(email, password)
        .then((user) => {
          signInCb(user);
        })
        .catch((err) => {
          if (!err.message) {
            console.log('Error signing in:', err);
            onLoadingChange(false);
          } else {
            if (err.code === 'UserNotConfirmedException') {
              console.log('User not confirmed');
              navigation.navigate('Confirmation', {
                email,
              });
              onLoadingChange(false);
            }
            if (err.message) {
              setErrorMessage(err.message);
              onLoadingChange(false);
            }
          }
        });
    } else {
      setErrorMessage('Provide a valid email and password');
      onLoadingChange(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <Logo height={125} width={125}/>
        <Text style={styles.title}>Welcome to Lopro!</Text>
        <Text style={styles.subtitle}>Protect your assets.</Text>
      </View>
      <FloatingTitleTextInput
        onChangeText={(text) => onChangeEmail(text)}
        placeholder={'Email'}
        placeholderTextColor='#9C9C9C'
      />
      <View style={{flexDirection:'row', alignItems:'center'}}>
        <FloatingTitleTextInput
          onChangeText={(text) => onChangePassword(text)}
          placeholder={'Password'}
          placeholderTextColor='#9C9C9C'
          secureTextEntry={hidePassword} 
          textInputStyle = {{ marginTop: 12, width: '75%', borderBottomRightRadius: 0, borderTopRightRadius: 0 }}
        />
        <View style={{alignItems:'center', backgroundColor: '#F5F5F5', height: 50, borderBottomRightRadius: 6, borderTopRightRadius: 6, marginTop: 12, width: '15%'}}>
          <TouchableOpacity style={{alignItems:'center', justifyContent: 'center', height: 50}}onPress={() => { setHidePassword(!hidePassword)}}>
          { hidePassword == true ?
            <EyeHideIcon width={20} height={20}/>
            :
            <EyeShowIcon width={24} height={24}/>
          }
          </TouchableOpacity>
        </View>
      </View>
      { errorMessage.length > 0 &&
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      }
      <Button styleOverride={styles.buttonStyle} onPress={() => signIn(signInCb)} isLoading={isLoading}>
        Sign In
      </Button>
      <TouchableOpacity onPress={() => { navigation.navigate('ForgetPassword'); setErrorMessage(''); }}>
        <Text style={styles.forgotPassword}>Forget Password?</Text>
      </TouchableOpacity>
      <View style={styles.createAccount}>
        <Text style={{color: '#8B909F'}}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => Link.openURL('https://lopro.io')}>
          <Text style={{color: '#7FC803'}}>Register at lopro.io!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

SignIn.propTypes = {
  signIn: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  buttonStyle: {
    backgroundColor: '#009345',
    borderColor: '#009345',
    height: 50,
    marginBottom: 12,
    marginTop: 24,
    width: '90%'
  },
  createAccount: {
    bottom: '0%',
    flexDirection: 'row',
    paddingBottom: '10%',
    position: 'absolute'
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: '100%',
    width: '100%'
  },
  errorMessage: {
    color: '#F56969',
    fontWeight: '500',
    paddingTop: 12,
    width: '90%'
  },
  forgotPassword: {
    color: '#7FC803'
  },
  headerContent: {
    alignItems:'center',
    justifyContent: 'center',
    marginTop:'20%',
  },
  subtitle: {
    color: '#6D7487',
    fontSize: 16,
    fontWeight: '400',
    paddingBottom: 32,
    paddingTop: 6
  },
  title: {
    fontSize: 20, 
    fontWeight: '600',
    paddingTop: 32,
  }
});
