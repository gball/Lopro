import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  buttonStyle: {
    backgroundColor: '#7FC803',
    borderColor: '#7FC803',
    borderWidth: 1.5,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    width: 85
  },
  loading: {
    left: 16,
    position:'absolute'
  },
  textStyle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600'
  }
});

const Button = ({ children,  isLoading, onPress, styleOverride }) => {  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.buttonStyle, styleOverride]}>
      { 
        isLoading &&
        <ActivityIndicator color='#FFFFFF' style={styles.loading} />
      }
      <Text style={[styles.textStyle, {color: styleOverride && styleOverride.color ? styleOverride.color : styles.textStyle.color }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
