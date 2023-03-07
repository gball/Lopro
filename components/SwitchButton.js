import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  buttonStyleSelected: {
    paddingBottom: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: '#2A3C24',
    width: '33.34%',
    alignItems: 'center'
  },
  buttonStyleUnselected: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#7FC803',
    width: '33.34%',
    alignItems: 'center'
  },
  textStyleUnselected: {
    fontSize: 14,
    color: '#7FC803'
  },
  textStyleSelected: {
    fontSize: 14,
    color: '#2A3C24'
  }
});

const SwitchButton = ({ onPress, children, inactive }) => {
  const buttonStyle = inactive ? styles.buttonStyleSelected : styles.buttonStyleUnselected;
  const textStyle = inactive ? styles.textStyleSelected : styles.textStyleUnselected;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
    >
      <Text style={textStyle}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default SwitchButton;
