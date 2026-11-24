import {BlurView} from 'expo-blur';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {STREAMX_GLASS, STREAMX_RADII, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

type GlassVariant = 'panel' | 'card' | 'chrome' | 'chip';

interface GlassSurfaceProps extends ViewProps {
  /** Visual weight of the material. */
  variant?: GlassVariant;
  radius?: number;
  /** Draws the ambient shadow. Turn off for full-bleed surfaces. */
  elevated?: boolean;
  /** Sheen strength, 0 disables the specular layer. */
  sheen?: number;
  /** Slight tint of gold light along the bottom edge. */
  tinted?: boolean;
  contentStyle?: ViewStyle;
}

const variantStyles: Record<
  GlassVariant,
  {radius: number; intensity: number; fill: 'fill' | 'fillStrong'}
> = {
  panel: {radius: STREAMX_RADII.lg, intensity: 1, fill: 'fill'},
  card: {radius: STREAMX_RADII.lg, intensity: 0.9, fill: 'fill'},
  chrome: {radius: STREAMX_RADII.xxl, intensity: 1.15, fill: 'fillStrong'},
  chip: {radius: STREAMX_RADII.pill, intensity: 0.7, fill: 'fill'},
};

/**
 * Layered liquid-glass material.
 *
 * Layer 1/2: the blurred backdrop.
 * Layer 3: translucent glass fill.
 * Layer 4: hairline edge highlight.
 * Layer 5: specular sheen.
 * Layer 6: children.
 *
 * Blur is skipped on platforms without native blur; the translucent fallback
 * keeps contrast intact instead of dropping a solid grey box.
 */
const GlassSurface = React.forwardRef<View, GlassSurfaceProps>(
  (
    {
      variant = 'panel',
      radius,
      elevated = true,
      sheen = 1,
      tinted = false,
      contentStyle,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const {mode} = useStreamXTheme();
    const glass = STREAMX_GLASS[mode];
    const preset = variantStyles[variant];
    const cornerRadius = radius ?? preset.radius;

    return (
      <View
        ref={ref}
        {...props}
        style={[
          {
            borderRadius: cornerRadius,
            overflow: 'hidden',
            backgroundColor: Platform.OS === 'android' ? glass.fallback : 'transparent',
          },
          elevated ? glassShadow(mode, variant === 'chip' ? 0.45 : 1) : null,
          style,
        ]}>
        <BlurView
          pointerEvents="none"
          intensity={Math.round(glass.blurIntensity * preset.intensity)}
          tint={glass.tint}
          // Android needs the Dimezis implementation for real background blur.
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: glass[preset.fill]},
          ]}
        />
        {sheen > 0 ? (
          <LinearGradient
            pointerEvents="none"
            colors={glass.sheen}
            locations={[0, 0.42, 1]}
            style={[
              StyleSheet.absoluteFill,
              {opacity: sheen},
            ]}
          />
        ) : null}
        {tinted ? (
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(217,201,173,0)',
              glass.reflection,
            ]}
            style={[StyleSheet.absoluteFill, {top: '55%'}]}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: cornerRadius,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: glass.border,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.topEdge,
            {borderTopColor: glass.border, borderRadius: cornerRadius},
          ]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  topEdge: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    left: 12,
    opacity: 0.9,
    position: 'absolute',
    right: 12,
    top: 0,
  },
});

GlassSurface.displayName = 'GlassSurface';

export default GlassSurface;
