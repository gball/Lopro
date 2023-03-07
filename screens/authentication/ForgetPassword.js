import { Auth } from '@aws-amplify/auth';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ArrowBackIcon from '../../assets/arrow-back.svg';
import Button from '../../components/Button';
import EyeHideIcon from '../../assets/eye-hide.svg';
import EyeShowIcon from '../../assets/eye-show.svg';
import FloatingTitleTextInput from '../../components/FloatingTitleTextInput';
import LogoFindIcon from '../../assets/logo-find.svg';

function ForgetPassword({ navigation }) {
  const [code, setCode] = useState('');
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [email, onChangeEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const getConfirmationCode = async () => {
    if (email.length > 4) {
      Auth.forgotPassword(email)
        .then(() => {
          setConfirmationStep(true);
          setErrorMessage('');
        })
        .catch((err) => {
          if (err.message) {
            setErrorMessage(err.message);
          }
        });
    } else {
      setErrorMessage('Provide a valid email');
    }
  };

  const postNewPassword = async () => {
    Auth.forgotPasswordSubmit(email, code, newPassword)
      .then(() => {
        setErrorMessage('');
        navigation.navigate('SignIn');
      })
      .catch((err) => {
        if (err.message) {
          setErrorMessage(err.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowBackIcon} onPress={() => { navigation.navigate('SignIn') }}>
        <ArrowBackIcon/>
      </TouchableOpacity>
      <View style={styles.header}>
          <LogoFindIcon height={'100%'} width={'100%'}/>
          <Text style={styles.headerTitle}>Forgot your password?</Text>
      </View>
      { !confirmationStep &&
        <>
          <FloatingTitleTextInput
            placeholder={'Email'}
            placeholderTextColor='#9C9C9C'
            onChangeText={(text) => onChangeEmail(text)}
            textInputStyle = {{ left:'5%', marginTop: 32}}
          />
          { errorMessage.length > 0 &&
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          }
          <Button styleOverride={styles.buttonStyle}
            onPress={() => getConfirmationCode()}
          >
            Reset Password
          </Button>
        </>
      }
      { confirmationStep && (
        <>
          <FloatingTitleTextInput
            customTitle={'Confirmation Code'}
            placeholder={'Check your email for the confirmation code.'}
            placeholderTextColor='#9C9C9C'
            onChangeText={(text) => setCode(text)}
            textInputStyle = {{ left:'5%', marginTop: 32}}
          />
          <View style={{flexDirection:'row', justifyContent:'center'}}>
            <FloatingTitleTextInput
              placeholder={'New Password'}
              placeholderTextColor='#9C9C9C'
              secureTextEntry={hidePassword}
              onChangeText={(text) => setNewPassword(text)}
              textInputStyle = {{ width: '75%',left:'5%', marginTop: 12}}
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
          <Button styleOverride={styles.buttonStyle} onPress={() => postNewPassword()}>
            Submit New Password
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arrowBackIcon: {
    left: '5%',
    position: 'absolute',
    top: '7.5%',
    zIndex: 1
  },
  buttonStyle: {
    backgroundColor: '#009345',
    borderColor: '#009345',
    height: 50,
    left: '2.5%',
    marginTop: 24,
    width: '90%'
  },
  container: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    width: '100%',
  },
  errorMessage: {
    color: '#F56969',
    fontWeight: '500',
    left: '5%',
    paddingTop: 12,
    width: '90%'
  },
  header: {
    alignItems: 'center',
    height: '22%',
    marginBottom: 32,
    marginTop: '25%',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500'
  },
});

export default ForgetPassword;
