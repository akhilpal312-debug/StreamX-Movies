import React from 'react';
import {
  Image,
  type ImageStyle,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import AppText from '../ui/Text';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

const MARK = require('../../../assets/brand/streamx-mark.png');
const FULL = require('../../../assets/brand/streamx-logo.png');

type Variant = 'mark' | 'full' | 'lockup';

interface StreamXLogoProps {
  variant?: Variant;
  size?: number;
  /** Wordmark colour; defaults to the theme's onSurface. */
  color?: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * StreamX branding.
 *
 * `full` is the supplied logo artwork, untouched. `mark` crops the X emblem for
 * compact chrome and `lockup` pairs the mark with the wordmark for headers and
 * the navigation drawer.
 */
const StreamXLogo = ({
  variant = 'lockup',
  size = 28,
  color,
  style,
}: StreamXLogoProps) => {
  const {colors} = useStreamXTheme();

  if (variant === 'full') {
    return (
      <Image
        source={FULL}
        resizeMode="contain"
        style={[{height: size, width: size}, style]}
      />
    );
  }

  if (variant === 'mark') {
    return (
      <Image
        source={MARK}
        resizeMode="contain"
        style={[{height: size, width: size}, style]}
      />
    );
  }

  return (
    <View style={[styles.lockup, style as StyleProp<ViewStyle>]}>
      <Image
        source={MARK}
        resizeMode="contain"
        style={{height: size * 1.35, width: size * 1.35}}
      />
      <AppText
        role="titleLargeEmphasized"
        style={{
          color: color ?? colors.onSurface,
          fontSize: size * 1.05,
          fontWeight: '700',
          letterSpacing: -0.6,
          marginLeft: 2,
        }}>
        StreamX
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  lockup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default StreamXLogo;
