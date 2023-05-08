import { Auth } from '@aws-amplify/auth';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera, CameraType } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Dimensions, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { useToast } from 'react-native-toast-notifications';
import { FlashList } from "@shopify/flash-list";
import AddIcon from '../assets/add.svg';
import AddDisabledIcon from '../assets/addDisabled.svg';
import ArrowDownIcon from '../assets/arrow-down.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BarcodeMask from '../components/BarcodeMask';
import Button from '../components/Button';
import Card from '../components/Card';
import CloseIcon from '../assets/close.svg';
import Constants from 'expo-constants';
import CheckmarkIcon from '../assets/checkmark.svg';
import ContactIcon from '../assets/contact.svg';
import GearIcon from '../assets/gear.svg';
import jwt_decode from "jwt-decode";
import Loader from '../components/Loader';
import Logo from '../assets/logo.svg';
import LogoFindIcon from '../assets/logo-find.svg';
import LogoutIcon from '../assets/log-out.svg';
import MaskInput from 'react-native-mask-input';
import PrivacyPolicyIcon from '../assets/privacy-policy.svg';
import React from 'react';
import SwitchButton from '../components/SwitchButton';
import TermsOfUseIcon from '../assets/terms-of-use.svg';
import * as Device from 'expo-device';
import * as Link from 'expo-linking';

const transformHeaderTitle = (title) => {
  return title.length <= 20 ? title : `${title.substring(0, 20)}...`;
};

export default function Detail({ navigation, signOut, user }) {
  const [barCodes] = useState(new Map());
  const [cameraPermissionModal, setCameraPermissionModal] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [headerTitle, setHeaderTitle] = useState(user.storeList.length > 1 ? transformHeaderTitle(user.storeSelected.address) : transformHeaderTitle(user.storeSelected.name));
  const [manualPacketInput, setManualPacketInput] = useState('');
  const [manualConfirmationInput, setManualConfirmationInput] = useState('');
  const [manualEntryErrorMessage, setManualEntryErrorMessage] = useState('');
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false);
  const [missingScanSelectionError, setMissingScanSelectionError] = useState(false);
  const [packNotActive, setPackNotActive] = useState(false);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanActivateActive, setScanActivateActive] = useState(false);
  const [scannedBackgroundColor, setScannedBackgroundColor] = useState('#000000');
  const [scannedCards, setScannedCards] = useState([]);
  const [scanShiftActive, setScanShiftActive] = useState(false);
  const [scanTypeUrl, setScanTypeUrl] = useState('');
  const [scanVendorActive, setScanVendorActive] = useState(false);
  const [selectedStoreAddress, setSelectedStoreAddress] = useState(user.storeSelected.address);
  const [selectedStoreName, setSelectedStoreName] = useState(user.storeSelected.name);
  const [shiftUrl] = useState(Constants.expoConfig.aws.gatewayURL.addDailyScratchers);
  const [storeLocations, setStoreLocations] = useState([]);
  const [textInputBorderColor, onTextInputBorderColorChange] = useState('');
  const [type] = useState(CameraType.back);
  
  const confirmationMask = [/\d/, /\d/, ' ', '-', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, ' ', '-', ' ', /\d/, /\d/];
  const lastTicketNumberPerCostMap = {'1': '240', '2': '100', '3': '100', '5': '080', '10': '050', '20': '030', '30': '030'};
  const modalSettingOptions = React.createRef();
  const modalStoreOptions = React.createRef();
  const packetMask = [/\d/, /\d/, /\d/, /\d/, ' ', '-', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  const toast = useToast();

  useEffect(() => {
    if (permission != null) {
      if (permission.canAskAgain && !permission.granted) {
        setCameraPermissionGranted(false);
        requestPermission();
      } else if (permission.status == 'denied' || permission.status == 'undefined') {
        setCameraPermissionGranted(false);
      } else {
        setCameraPermissionGranted(true);
        return () => {};
      }
    }
  }, [permission]);

  const changeSelectedStoreLocation = (store) => {
    if (user.storeSelected.id != store.id) {
      displayToast(`Store changed to ${store.address}`, '#5A5A5A');
    }

    AsyncStorage.removeItem('preferredDeviceStoreLocation');
    AsyncStorage.setItem('preferredDeviceStoreLocation', JSON.stringify(store));
    setHeaderTitle(transformHeaderTitle(store.address));
    user.storeSelected = store; 
    setSelectedStoreAddress(user.storeSelected.address);
    setSelectedStoreName(user.storeSelected.name);
    modalStoreOptions.current.close();
  };

  const renderStoreLocations = ({ item }) => {
    if (item.id == user.storeSelected.id) {
      return(
        <Pressable style={[styles.modalBottomOptionTextContainer, styles.modalBottomOptionTextContainerSelected]} onPress={() => changeSelectedStoreLocation(item)}>
          <View>
            <Text style={styles.modalBottomOptionText}>{item.name}</Text>
            <Text style={styles.modalBottomOptionSubText}>{item.address}</Text>
          </View>
          <CheckmarkIcon style={styles.modalBottomOptionSettingsIcon}/>
        </Pressable>
      );
    } else {
      return(
        <Pressable style={styles.modalBottomOptionTextContainer} onPress={() => changeSelectedStoreLocation(item)}>
          <Text style={styles.modalBottomOptionText}>{item.name}</Text>
          <Text style={styles.modalBottomOptionSubText}>{item.address}</Text>
        </Pressable>
      );
    }
  };
  
  displayToast = (message, color) => {
    toast.show(message, {
      type: 'custom_type',
      color: color,
      placement: 'bottom',
      duration: 3000,
      offset: 1,
      animationType: 'zoom-in'
    });
  }

  getUpdatedToken = async () => {
    return await Auth.currentSession()
      .then((user) => {
        return user.idToken.jwtToken;
      })
      .catch((err) => {
        console.log('Error getting refresh token:', err);
      });
  }

  triggerDailyScratcherReport = async () => {
    this.loadingButton.showLoading(true);
    let body = {
      confirmationNumber: confirmationNumber,
      deviceModelName: Device.modelName,
      deviceName: Device.deviceName,
      packetsInfo: scanTypeUrl == shiftUrl ? barCodes : [...barCodes.keys()],
      storeAddress: user.storeSelected.address,
      storeEmails: user.storeSelected.emails,
      storeId: user.storeSelected.id,
      storeName: user.storeSelected.name
    };

    try {
      const decodedAccessToken = jwt_decode(user.accessToken);
      const dateNow = new Date();
      if ((decodedAccessToken.exp * 1000) < dateNow.getTime()) {
        user.clientToken = await getUpdatedToken();
      }

      return await fetch(scanTypeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': user.clientToken
        },
        body: scanTypeUrl == shiftUrl ? JSON.stringify(body, (_key, value) => (value instanceof Map ? Array.from(value.entries()): value)) : JSON.stringify(body)
      })
      .then((response) => response.json())
      .then(async (data) => {
        if (data.statusCode != 200) {
          throw data;
        }
        
        barCodes.clear();
        setScannedCards([...barCodes]);
        this.loadingButton.showLoading(false);
        displayToast('Submission successful.', '#A1C349');
        setConfirmationNumber('');
        setScanActivateActive(false);
        setScanShiftActive(false);
        setScanVendorActive(false);
        setScanTypeUrl('');

        return true;
      })
      .catch(async (error) => {
        body.error = JSON.stringify(error);

        await fetch(Constants.expoConfig.aws.gatewayURL.reportError, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': user.clientToken
          },
          body: JSON.stringify(body, (_key, value) => (value instanceof Map ? Array.from(value.entries()): value))
        });

        console.log(error);
        this.loadingButton.showLoading(false);
        displayToast('Please try again. If it continues, contact us..', '#F56969');
        return false;
      });
    } catch (error) {
      body.error = JSON.stringify(error);

      await fetch(Constants.expoConfig.aws.gatewayURL.reportError, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': user.clientToken
        },
        body: JSON.stringify(body, (_key, value) => (value instanceof Map ? Array.from(value.entries()): value))
      });

      console.log(error);
      this.loadingButton.showLoading(false);
      displayToast('Please try again. If it continues, contact us..', '#F56969');
      return false;
    }
  };

  const handleBarCodeScanned = async ({ bounds, data }) => {
    if (scanTypeUrl.length == 0) {
      if (!missingScanSelectionError) {
        setMissingScanSelectionError(true)
        displayToast('Please select scan type.', '#F56969');
        setTimeout(() => {
          setMissingScanSelectionError(false)
        }, 3000);
      }
      
      return;
    }

    const activePacks = new Set(JSON.parse(await AsyncStorage.getItem('activePacks'))[user.storeSelected.id]);
    const scratcherValueMap = JSON.parse(await AsyncStorage.getItem('scratcherValueMap'));
    const windowsHeight = Dimensions.get('window').height;
    const windowsWidth = Dimensions.get('window').width;
    // 7.5% (padding in mask) + 5% (padding from container css) = .125
    const lowerXBound = windowsWidth * 0.125;
    const upperXBound = windowsWidth * 0.875;
    // camer height 0.4% 
    const camerHeight = windowsHeight * 0.4;
    const cameraHeightMargin = (camerHeight * 0.65) / 2;
    // header (10%) and options (7%) and paddingTop (from container css) (10%) = .27
    const lowerYBound = (windowsHeight * 0.27) + cameraHeightMargin;
    const upperYBound = lowerYBound + (camerHeight * 0.40);
    const boundX =  bounds && bounds.origin ? Number(bounds.origin.y) * windowsWidth : lowerXBound;
    const boundY = bounds && bounds.origin ?  Number(bounds.origin.x) * windowsHeight : lowerYBound;
    if (boundX >= lowerXBound && boundX <= upperXBound && boundY >= lowerYBound && boundY <= upperYBound) {
      let ticketNumber = data.substring(0,14);
      let packNumber = parseInt(ticketNumber.slice(0, -3));
      let scratcherInfo = scratcherValueMap[ticketNumber.slice(0, 4)];
      scratcherInfo.ticketNumber = ticketNumber;

      if (barCodes.get(packNumber) == undefined && ticketNumber.length == 14 && scratcherInfo != undefined) {
        if (scanShiftActive && !activePacks.has(packNumber)) {
          if (!packNotActive) {
            setPackNotActive(true)
            displayToast(`Pack, ${packNumber}, not active.`, '#F56969');
            setTimeout(() => {
              setPackNotActive(false)
            }, 3000);
          }
          return;
        }
        // TODO: update solution ... this fixes some weird edge case where sometimes scan this (jank ass solution)
        if (ticketNumber.slice(0, 11) == '15000000000') {
          return;
        }

        setScannedBackgroundColor('#A1C349');
        let intervalId = setInterval(() => {
          setScannedBackgroundColor('#000000');
          clearInterval(intervalId);
        }, 350);
        
        barCodes.set(packNumber, parseInt(ticketNumber.slice(-3)));
        setScannedCards((previousCards) => [
          <Card key={packNumber} scratcherInfo={scratcherInfo} onPress={() => onTrashPressed(ticketNumber, packNumber)}></Card>,
          ...previousCards
        ]);
      }
    }
  };

  const onTrashPressed = (ticketNumber, packNumber) => {
    setScannedCards((current) =>
      current.filter((scannedCards) => 
        ticketNumber != scannedCards.props.scratcherInfo.ticketNumber
      )
    );

    barCodes.delete(packNumber);
  };

  const loadActivePacks =  async (id, token) => {
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

  const onScanTypePressed = async (scanType) => {
    const decodedAccessToken = jwt_decode(user.accessToken);
    const dateNow = new Date();
    if ((decodedAccessToken.exp * 1000) < dateNow.getTime()) {
      user.clientToken = await getUpdatedToken();
    }

    await loadActivePacks(user.id, user.clientToken);

    if (scanType == 'Vendor') {
      setScanActivateActive(false);
      setScanShiftActive(false);
      setScanVendorActive(true);
      setScanTypeUrl(Constants.expoConfig.aws.gatewayURL.addLotteryVendedScratcher);
    } else if (scanType == 'Shift') {
      setScanActivateActive(false);
      setScanShiftActive(true);
      setScanVendorActive(false);
      setScanTypeUrl(Constants.expoConfig.aws.gatewayURL.addDailyScratchers);
    } else {
      setScanActivateActive(true);
      setScanShiftActive(false);
      setScanVendorActive(false);
      setScanTypeUrl(Constants.expoConfig.aws.gatewayURL.activatePack);
    }
  };

  const addManualEntry = async () => {
    if (scanVendorActive) {
      if (manualConfirmationInput.length < 12 || confirmationNumber.length > 0) {
        const message = manualConfirmationInput.length < 12 ? 'Missing digits in entry' : 'Confirmation has already been added.\nPlease delete previous one first.';
        setManualEntryErrorMessage(message);
      } else {
        const scratcherInfo = {name: 'Confirmation Number', ticketNumber: manualConfirmationInput}
        setConfirmationNumber(manualConfirmationInput);
        setScannedCards((previousCards) => [
          <Card 
          key={manualConfirmationInput} 
          scratcherInfo={scratcherInfo} 
          onPress={() => { onTrashPressed(manualConfirmationInput); setConfirmationNumber(''); }}
          ></Card>,
          ...previousCards
        ]);
        setManualEntryModalVisible(!manualEntryModalVisible);
        setManualConfirmationInput('');
        setManualEntryErrorMessage('');
      }
    } else {
      const scratcherValueMap = JSON.parse(await AsyncStorage.getItem('scratcherValueMap'));
      const activePacks = new Set(JSON.parse(await AsyncStorage.getItem('activePacks'))[user.storeSelected.id]);
      let scratcherInfo = scratcherValueMap[manualPacketInput.slice(0, 4)];

      if (manualPacketInput.length < 11 || scratcherInfo == undefined || barCodes.get(parseInt(manualPacketInput)) != undefined) {
        let message = 'Pack already exists in recent scans.';
        if (manualPacketInput.length < 11) {
          message = 'Missing digits in entry.';
        } else if (scratcherInfo == undefined) {
          message = 'This packet does not exist.';
        }
        setManualEntryErrorMessage(message);
      } else if (scanShiftActive && activePacks.has(parseInt(manualPacketInput)) == false) {
        let message = 'Pack has not been activated.';
        setManualEntryErrorMessage(message);
      } else {
        const manualLastTicketNumber = lastTicketNumberPerCostMap[scratcherInfo.value];
        const ticketNumber = manualPacketInput + manualLastTicketNumber;
        scratcherInfo.ticketNumber = ticketNumber;
        barCodes.set(parseInt(manualPacketInput), parseInt(manualLastTicketNumber));
        setScannedCards((previousCards) => [
          <Card key={manualPacketInput} scratcherInfo={scratcherInfo} onPress={() => onTrashPressed(ticketNumber, parseInt(manualPacketInput))}></Card>,
          ...previousCards
        ]);
        setManualEntryModalVisible(!manualEntryModalVisible);
        setManualPacketInput('');
        setManualEntryErrorMessage('');
      }
    }
  };

  openModalSettingOptions = () => {
    if (modalSettingOptions.current) {
      modalSettingOptions.current.open();
    }
  };

  openModalStoreOptions = () => {
    setStoreLocations(user.storeList);
    
    if (modalStoreOptions.current) {
      modalStoreOptions.current.open();
    }
  };

  return (
    <View>
      <View style={styles.container}>
          <Modal
              animationType='slide'
              transparent={true}
              visible={cameraPermissionModal}
            >
            <View style={styles.modalViewPermissions}>
              <View style={[styles.modalViewCentered, styles.modalViewCenteredPermissions]}>
                <Text style={styles.modalViewText}>Oops!</Text>
                <Text style={styles.modalViewTextPermission}>Lopro is a camera app! To continue, you'll need to allow Camera access in Settings. Once permission is granted, you can start scanning your inventory.</Text>
                <Button styleOverride={styles.button} children={'Open Settings'}  onPress={() => Linking.openSettings() }/>
              </View>
            </View>
          </Modal>
        <View style={styles.header}>
          <Logo style={styles.logo}/>
          { user.storeList.length > 1 &&
            <Pressable style={styles.headerTitleSection} onPress={() => openModalStoreOptions()}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <ArrowDownIcon/>
            </Pressable>
          }
          { user.storeList.length == 1 &&
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          }
          <Pressable onPress={() => openModalSettingOptions()}>
            <GearIcon styles={styles.gearIcon}/>
          </Pressable>
        </View>
        <View style={styles.options}>
          <SwitchButton inactive={scanVendorActive} children={'New Inventory'} onPress={() => onScanTypePressed('Vendor')}></SwitchButton>
          <SwitchButton inactive={scanActivateActive} children={'Pack Activate'} onPress={() => onScanTypePressed('Activate')}></SwitchButton>
          <SwitchButton inactive={scanShiftActive} children={'Shift End'} onPress={() => onScanTypePressed('Shift')}></SwitchButton>
        </View>
        { cameraPermissionGranted &&
          <Camera
            barCodeScannerSettings={{barCodeTypes: [BarCodeScanner.Constants.BarCodeType.Interleaved2of5, BarCodeScanner.Constants.BarCodeType.itf14]}} 
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.camera}
            type={type}
          >
            <BarcodeMask
              backgroundColor={scannedBackgroundColor}
              edgeBorderWidth={2}
              edgeColor={'#7FC803'}
              edgeHeight={'100%'}
              edgeRadius={5}
              edgeWidth={'100%'}
              height={'40%'}
              outerMaskOpacity={0.5}
              showAnimatedLine={false}
              width={'85%'}
            />
          </Camera>
        }
        { !cameraPermissionGranted &&
          <View style={styles.cameraBlocked}>
            <Button onPress={() => { setCameraPermissionModal(true); setCameraPermissionGranted(true);}} styleOverride={{width: '50%'}}>Start Scanning</Button>
          </View>
        }
        <View style={styles.scannedContainer}>
          <View style={styles.recentScansContainer}>
            <Text style={styles.recentScans}>Recent Scans</Text>
            { scanTypeUrl.length !== 0 &&
              <Pressable onPress={() => setManualEntryModalVisible(true)}>
                <AddIcon/>
              </Pressable>
            }
            { scanTypeUrl.length === 0 &&
              <AddDisabledIcon/>
            }
            <Modal
              animationType='slide'
              onRequestClose={() => {
                setManualEntryModalVisible(!manualEntryModalVisible);
              }}
              transparent={true}
              visible={manualEntryModalVisible}
            >
              <View style={styles.modalView}>
                <Pressable 
                  style={styles.modalViewCloseIcon}
                  onPress={() => { setManualEntryModalVisible(!manualEntryModalVisible); setManualEntryErrorMessage(''); onTextInputBorderColorChange('#000000'); }}
                >
                  <CloseIcon/>
                </Pressable>
                <View style={styles.modalViewCentered}>
                  { scanVendorActive &&
                    <Text style={styles.modalViewText}>Confirmation Number</Text>
                  }
                  {
                    (scanActivateActive || scanShiftActive) &&
                    <Text style={styles.modalViewText}>Manual Packet Entry</Text>
                  }
                  <MaskInput
                    value={scanVendorActive ? manualConfirmationInput : manualPacketInput}
                    onChangeText={(masked, unmasked) => { 
                      scanVendorActive ? setManualConfirmationInput(unmasked) : setManualPacketInput(unmasked);
                    }}
                    mask={scanVendorActive ? confirmationMask : packetMask}
                    onFocus={() => {onTextInputBorderColorChange('#7FC803');}}
                    placeholderTextColor='#9C9C9C'
                    style={[styles.maskedInput, {borderColor: textInputBorderColor}]}
                    keyboardType='numeric'
                    selectionColor={'#7FC803'}
                  />
                  <View style={styles.buttonContainer}>
                    <Button 
                      styleOverride={styles.buttonWhite} 
                      children={'Cancel'} 
                      onPress={() => { setManualEntryModalVisible(!manualEntryModalVisible); setManualEntryErrorMessage(''); onTextInputBorderColorChange('#000000'); }}
                    />
                    <Button styleOverride={styles.button} children={'Add'}  onPress={() => { addManualEntry() }}/>
                  </View>
                  {
                    manualEntryErrorMessage.length > 0 &&
                    <Text style={styles.modalViewErrorMessage}>{manualEntryErrorMessage}</Text>
                  }
                </View>
              </View>
            </Modal>
          </View>
          { scannedCards.length > 0 &&
            <ScrollView style={{ marginTop: 18 }} showsVerticalScrollIndicator={false}>
              {scannedCards}
            </ScrollView>
          } 
          { scannedCards.length == 0 &&
            <View style={styles.noScanContainer}>
              <LogoFindIcon height={'70%'} width={'100%'}/>
              <Text>No scans yet ...</Text>
            </View>
          }
        </View>
      </View>
      <View style={styles.finishedSection}>
        <Text style={styles.counter}>Packets Scanned: {barCodes.size}</Text>
        <Loader
          ref={c => (this.loadingButton = c)}
          width={85}
          height={35}
          title='Submit'
          titleFontSize={14}
          titleColor='rgb(255,255,255)'
          backgroundColor={scannedCards.length == 0 ? '#9C9C9C' :'#7FC803'}
          borderRadius={8}
          onPress={() => triggerDailyScratcherReport()}
          titleFontWeight={'600'}
          disabled={scannedCards.length == 0 ? true : false}
        />
      </View>
      <Modalize ref={modalSettingOptions} adjustToContentHeight={true}>
        <View style={styles.modalBottomContainer}>
          <Text style={styles.modalBottomHeader}>Settings</Text>
          <Pressable style={[styles.modalBottomOptionTextContainer, styles.modalBottomOptionSettings]} onPress={() => { navigation.navigate('Contact') }}>
            <ContactIcon style={styles.modalBottomOptionSettingsIcon}/>
            <Text style={styles.modalBottomOptionText}>Contact</Text>
          </Pressable>
          <Pressable style={[styles.modalBottomOptionTextContainer, styles.modalBottomOptionSettings]} onPress={() => Link.openURL('https://lopro.io/terms-of-use')}>
            <TermsOfUseIcon style={styles.modalBottomOptionSettingsIcon}/>
            <Text style={styles.modalBottomOptionText}>Terms of use</Text>
          </Pressable>
          <Pressable style={[styles.modalBottomOptionTextContainer, styles.modalBottomOptionSettings]} onPress={() => Link.openURL('https://lopro.io/privacy-policy')}>
            <PrivacyPolicyIcon style={styles.modalBottomOptionSettingsIcon}/>
            <Text style={styles.modalBottomOptionText}>Privacy Policy</Text>
          </Pressable>
          <Pressable style={[styles.modalBottomOptionTextContainer, styles.modalBottomOptionSettings]} onPress={() => signOut()}>
            <LogoutIcon style={styles.modalBottomOptionSettingsIcon}/>
            <Text style={styles.modalBottomOptionText}>Sign Out</Text>
          </Pressable>
        </View>
      </Modalize>
      <Modalize ref={modalStoreOptions} adjustToContentHeight={true}>
        <View style={styles.modalBottomContainer}>
          <Text style={styles.modalBottomHeader}>Select Store Location</Text>
          <FlashList
            estimatedItemSize={3}
            data={storeLocations} 
            renderItem={renderStoreLocations} 
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { 
    height: 40,
    width: '48%'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
    width: '100%'
  },
  buttonWhite: {
    backgroundColor: '#FFFFFF',
    color: '#7FC803',
    height: 40,
    width: '48%'
  },
  camera: {
    height: '40%',
    borderRadius: 7,
    overflow: 'hidden'
  },
  cameraBlocked: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 7,
    justifyContent: 'center',
    height: '40%'
  },
  container: {
    paddingTop: '10%',
    height: '100%',
    width: '90%',
    maxWidth: '90%',
    left: '5%'
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    position: 'absolute',
    color: 'red',
    left: '5%',
    width: '90%',
    top: '30%'
  },
  finishedSection: {
    paddingLeft: '5%',
    paddingRight: '5%',
    height: '10%',
    width: '100%',
    bottom: 0,
    zIndex: 1,
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 12,
    position: 'absolute'
  },
  gearIcon: {
    width: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '5%',
    marginTop: '2.5%',
    marginBottom: '2.5%'
  },
  headerTitleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500'
  },
  logo: {
    height: 32,
    width: 20
  },
  maskedInput: {
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#000000',
    marginTop: '5%',
    padding: 16,
    width: '100%',
  },  
  modalBottomContainer: {
    height: Dimensions.get('window').height * 0.35,
    marginBottom: 24,
    padding: '5%',
    width: '100%'
  },
  modalBottomHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: '3%',
    marginTop: '5%'
  },
  modalBottomOptionSettings: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  modalBottomOptionSettingsIcon: {
    marginRight: 10
  },
  modalBottomOptionTextContainer: {
    paddingBottom: 12,
    paddingTop: 12
  },
  modalBottomOptionTextContainerSelected: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalBottomOptionSubText: {
    color: '#808080',
    fontSize: 12,
    paddingTop: 2
  },
  modalBottomOptionText: {
    fontSize: 16
  },
  modalView: {
    height: Dimensions.get('window').height * 0.32,
    top: Platform.OS == 'ios' ? Dimensions.get('window').height * 0.185 : Dimensions.get('window').height * 0.15 
  },
  modalViewPermissions: {
    height: '30%',
    left: '5%',
    top: '22%',
    width: '90%'
  },
  modalViewCentered: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: '100%',
    justifyContent: 'center',
    left: '7.5%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      height: 2,
      width: 0
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '85%'
  },
  modalViewCenteredPermissions: {
    justifyContent:'center',
    left: '5%',
    width: '90%'
  },
  modalViewErrorMessage: {
    color: '#F56969',
    fontSize: 16,
    position: 'absolute',
    top: '95%'
  },
  modalViewText: {
    fontSize: 18,
    fontWeight: '600'
  },
  modalViewTextPermission: {
    marginBottom: 16,
    marginTop: 32,
    textAlign: 'center'
  },
  modalViewCloseIcon: {
    left: '84%',
    top: 36,
    zIndex: 1
  },
  noScanContainer : {
    alignItems: 'center',
    justifyContent: 'center',
    height: '75%',
    width: '100%'
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '3%',
    height: '7%',
  },
  recentScans: {
    fontSize: 16
  },
  recentScansContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20
  },
  scannedContainer: {
    height: '36%',
    width: '100%'
  },
  subheaderContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  subheaderTitle: {
    fontSize: 12,
    color: '#808080',
  }
});
