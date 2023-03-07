import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import TrashBinIcon from '../assets/trash-bin.svg';

const styles = StyleSheet.create({
  buttonStyle: {
    padding: 10,
    backgroundColor: 'white',
    borderColor: 'white',
    borderRadius: 10,
    borderWidth: 1
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'white',
    padding: 10,
    backgroundColor: 'white',
    marginBottom: 18
  },
  scratcherImageBox: {
    height: '100%',
    width: '18%'
  },
  scratcherImage: {
    backgroundColor: '#CCCCCC',
    borderRadius: 8,
    height: '100%',
    width: '100%',
  },
  subText: {
    marginTop: 6,
    fontSize: 12,
    color: '#757575'
  },
  text: {
    width: '75%',
    justifyContent: 'center',
    paddingLeft: 10
  },
  textOnly: {
    width: '93%',
  },
  trash: {
    width: '7%',
    justifyContent: 'center',
    alignItems: 'flex-end'
  }
});

const Card = ({ onPress, scratcherInfo }) => {
  return (
    <View style={styles.container}>
      { scratcherInfo.url &&
        <View style={styles.scratcherImageBox}>
          <Image style={styles.scratcherImage} source={{uri: scratcherInfo.url}} defaultSource={Platform.OS == 'ios' ? require('../assets/placeholder.png') : ''}/>
        </View>
      }
      <View style={[styles.text, scratcherInfo.value == null ? styles.textOnly : '']}>
        <Text>{scratcherInfo.name}</Text>
        { scratcherInfo.value &&
          <Text style={styles.subText}>{scratcherInfo.ticketNumber} - ${scratcherInfo.value}</Text>
        }
        { scratcherInfo.value == null &&
          <Text style={styles.subText}>{scratcherInfo.ticketNumber}</Text>
        }
      </View>
      <TouchableOpacity style={styles.trash} onPress={onPress}>
        <TrashBinIcon key={scratcherInfo.ticketNumber}/>
      </TouchableOpacity>
    </View>
  );
};

export default Card;
