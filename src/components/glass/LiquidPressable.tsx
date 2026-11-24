import React, {useCallback, useState} from 'react';
import {
  AccessibilityProps,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LIQUID_SPRINGS, STREAMX_RADII} from '../../theme/streamx';
import {settingsStorage} from '../../lib/storage';

interface LiquidPressableProps extends AccessibilityProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** How far the glass compresses on touch. */
  pressScale?: number;
  haptic?: boolean;
  testID?: string;
}

/**
 * Glass interaction surface.
 *
 * Touch compresses the surface with a spring-damper model (F = -kx - cv),
 * brightens the edge and lights a soft specular spot at the finger. Release
 * returns to rest with a slightly softer spring so the material feels elastic
 * rather than snappy.
 */
const LiquidPressable = React.forwardRef<View, LiquidPressableProps>(
  (
    {
      children,
      onPress,
      onLongPress,
      disabled = false,
      radius = STREAMX_RADII.lg,
      style,
      pressScale = 0.965,
      haptic = true,
      testID,
      ...accessibility
    },
    ref,
  ) => {
    const scale = useSharedValue(1);
    const light = useSharedValue(0);
    const [touch, setTouch] = useState({x: 0, y: 0});

    const handlePressIn = useCallback(
      (event: GestureResponderEvent) => {
        scale.value = withSpring(pressScale, LIQUID_SPRINGS.press);
        light.value = withSpring(1, LIQUID_SPRINGS.press);
        const {locationX, locationY} = event.nativeEvent;
        setTouch({x: locationX, y: locationY});
        if (haptic && settingsStorage.isHapticFeedbackEnabled()) {
          ReactNativeHapticFeedback.trigger('effectTick', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
      },
      [haptic, light, pressScale, scale],
    );

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, LIQUID_SPRINGS.release);
      light.value = withSpring(0, LIQUID_SPRINGS.release);
    }, [light, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: scale.value}],
    }));

    const lightStyle = useAnimatedStyle(() => ({
      opacity: light.value * 0.6,
      transform: [{scale: 0.6 + light.value * 0.7}],
    }));

    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          ref={ref as never}
          {...accessibility}
          testID={testID}
          disabled={disabled}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={
            Platform.OS === 'android'
              ? {color: 'rgba(255,255,255,0.12)', borderless: false}
              : undefined
          }
          style={{borderRadius: radius, overflow: 'hidden'}}>
          {children}
          <View pointerEvents="none" style={[absoluteFill, {borderRadius: radius}]}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  left: touch.x - 60,
                  top: touch.y - 60,
                  backgroundColor: 'rgba(255,255,255,0.42)',
                },
                lightStyle,
              ]}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

const absoluteFill = {
  bottom: 0,
  left: 0,
  position: 'absolute' as const,
  right: 0,
  top: 0,
  overflow: 'hidden' as const,
};

LiquidPressable.displayName = 'LiquidPressable';

export default LiquidPressable;
