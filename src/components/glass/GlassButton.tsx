import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppText from '../ui/Text';
import LiquidPressable from './LiquidPressable';
import {STREAMX_RADII, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

export type GlassButtonTone = 'pearl' | 'ink' | 'glass' | 'gold';

interface GlassButtonProps {
  label: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  tone?: GlassButtonTone;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Primary action surface for the StreamX interface. Pearl and ink tones cover
 * the reference's white pills on artwork and dark pills on glass.
 */
const GlassButton = ({
  label,
  icon,
  onPress,
  tone = 'ink',
  compact = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  testID,
  accessibilityLabel,
}: GlassButtonProps) => {
  const {mode, colors, glass} = useStreamXTheme();

  const tones: Record<
    GlassButtonTone,
    {fill: string; text: string; border: string; sheen: [string, string, string]}
  > = {
    pearl: {
      fill: 'rgba(250,249,251,0.94)',
      text: '#1E1D24',
      border: 'rgba(255,255,255,0.9)',
      sheen: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.1)', 'rgba(217,201,173,0.25)'],
    },
    ink: {
      fill: mode === 'light' ? '#24232A' : '#EDE9E2',
      text: mode === 'light' ? '#FAF9FB' : '#1A1A20',
      border: mode === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
      sheen: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.08)'],
    },
    glass: {
      fill: glass.fill,
      text: colors.onSurface,
      border: glass.border,
      sheen: glass.sheen,
    },
    gold: {
      fill: '#D9C9AD',
      text: '#2B2618',
      border: 'rgba(255,255,255,0.6)',
      sheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)', 'rgba(185,164,126,0.35)'],
    },
  };

  const palette = tones[tone];
  const height = compact ? 40 : 50;

  return (
    <LiquidPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled, busy: loading}}
      disabled={disabled || loading}
      onPress={onPress}
      radius={STREAMX_RADII.pill}
      style={[
        fullWidth ? styles.fullWidth : null,
        glassShadow(mode, 0.5),
        style,
      ]}>
      <View
        style={[
          styles.content,
          {
            backgroundColor: palette.fill,
            borderColor: palette.border,
            height,
            paddingHorizontal: compact ? 16 : 22,
          },
        ]}>
        <LinearGradient
          pointerEvents="none"
          colors={palette.sheen}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        {loading ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={compact ? 17 : 20}
            color={palette.text}
            style={{marginRight: 8}}
          />
        ) : null}
        <AppText
          numberOfLines={1}
          style={{
            color: palette.text,
            fontSize: compact ? 13 : 15,
            fontWeight: '700',
            letterSpacing: 0.1,
          }}>
          {label}
        </AppText>
      </View>
    </LiquidPressable>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    borderRadius: STREAMX_RADII.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
});

export default GlassButton;
