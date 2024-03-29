import { ActivityIndicator, Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';

export default class Component extends React.PureComponent {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    titleColor: PropTypes.string,
    titleFontFamily: PropTypes.string,
    titleFontSize: PropTypes.number,
    titleFontWeight: PropTypes.string,
    backgroundColor: PropTypes.string,
    borderWidth: PropTypes.number,
    borderRadius: PropTypes.number,
    activityIndicatorColor: PropTypes.string,
    onPress: PropTypes.func.isRequired
  };

  static defaultProps = {
    title: 'Button',
    titleColor: 'white',
    backgroundColor: 'gray',
    activityIndicatorColor: 'white',
    borderRadius: 0
  };

  constructor(props) {
    super(props);

    this.state = {
      showLoading: false
    };

    this.loadingValue = {
      width: new Animated.Value(props.width),
      borderRadius: new Animated.Value(props.borderRadius),
      opacity: new Animated.Value(1)
    };
  }

  showLoading(showLoading) {
    if (showLoading) {
      this._loadingAnimation(this.props.width, this.props.height, this.props.borderRadius, this.props.height / 2, 1, 0);
      this.setState({ showLoading: showLoading });
    } else {
      setTimeout(() => {
        this._loadingAnimation(this.props.height, this.props.width, this.props.height / 2, this.props.borderRadius, 0, 1);
        this.setState({ showLoading: showLoading });
      }, 1000);
    }
  }

  _loadingAnimation(widthStart, widthEnd, borderRadiusStart, borderRadiusEnd, opacityStart, opacityEnd) {
    if (this.loadingValue.width._value !== widthEnd) {
      this.loadingValue.width.setValue(widthStart);
      this.loadingValue.opacity.setValue(opacityStart);
      this.loadingValue.borderRadius.setValue(borderRadiusStart);

      Animated.timing(this.loadingValue.width, {
        toValue: widthEnd,
        duration: 500,
        useNativeDriver: false
      }).start();

      Animated.timing(this.loadingValue.borderRadius, {
        toValue: borderRadiusEnd,
        duration: 500,
        useNativeDriver: false
      }).start();

      Animated.timing(this.loadingValue.opacity, {
        toValue: opacityEnd,
        duration: 400,
        useNativeDriver: false
      }).start();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback disabled={this.props.disabled} onPress={!this.state.showLoading ? this.props.onPress : null}>
          <Animated.View
            style={[
              styles.containerButton,
              {
                width: this.loadingValue.width,
                height: this.props.height,
                backgroundColor: this.props.backgroundColor,
                borderWidth: this.props.borderWidth,
                borderRadius: this.loadingValue.borderRadius
              }
            ]}
          >
            {this.state.showLoading ? this._renderIndicator() : this._renderTitle()}
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  _renderTitle() {
    return (
      <Animated.Text
        style={[
          styles.buttonText,
          {
            opacity: this.loadingValue.opacity,
            color: this.props.titleColor,
            fontFamily: this.props.titleFontFamily,
            fontSize: this.props.titleFontSize,
            fontWeight: this.props.titleFontWeight,
            disabled: this.props.disabled,
            disabledColor: this.props.disabledColor
          }
        ]}
      >
        {this.props.title}
      </Animated.Text>
    );
  }

  _renderIndicator() {
    return <ActivityIndicator color={this.props.activityIndicatorColor} />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  containerButton: {
    justifyContent: 'center'
  },
  buttonText: {
    backgroundColor: 'transparent',
    textAlign: 'center'
  }
});
