import React from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

/**
 * Covers content scrolling under the status bar. Defaults to the active StreamX
 * surface; artwork-led screens pass their own scrim colour.
 */
const StatusBarScrim = ({
  visible,
  color,
}: {
  visible: boolean;
  color?: string;
}) => {
  const insets = useSafeAreaInsets();
  const colors = useM3Colors();
  const {mode} = useStreamXTheme();
  const scrim =
    color ?? (mode === 'light' ? colors.background : 'rgba(21,21,27,0.92)');

  return (
    <View
      pointerEvents="none"
      style={{
        backgroundColor: visible ? scrim : 'transparent',
        height: insets.top,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    />
  );
};

export default StatusBarScrim;
