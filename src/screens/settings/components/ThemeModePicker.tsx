import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {View} from 'react-native';
import useThemeStore, {type ThemeMode} from '../../../lib/zustand/themeStore';
import {useM3Colors} from '../../../theme/M3PaletteContext';
import AppText from '../../../components/ui/Text';
import {TVFocusable} from '../../../components/tv';

const MODES: Array<{
  id: ThemeMode;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  {id: 'light', label: 'Light', hint: 'Pearl glass', icon: 'white-balance-sunny'},
  {id: 'dark', label: 'Dark', hint: 'Cinematic', icon: 'weather-night'},
  {id: 'system', label: 'Auto', hint: 'Follow device', icon: 'theme-light-dark'},
];

/** Light, dark or system appearance for the StreamX glass palette. */
const ThemeModePicker = () => {
  const mode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);
  const colors = useM3Colors();

  return (
    <View style={{marginBottom: 24}}>
      <AppText
        role="labelLarge"
        style={{color: colors.onSurfaceVariant, marginBottom: 12}}>
        Appearance
      </AppText>
      <View style={{flexDirection: 'row', gap: 10}}>
        {MODES.map(option => {
          const selected = mode === option.id;
          return (
            <TVFocusable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} appearance`}
              accessibilityState={{selected}}
              onPress={() => setMode(option.id)}
              borderRadius={20}
              focusScale={1.04}
              style={{
                alignItems: 'center',
                backgroundColor: selected
                  ? colors.primary
                  : colors.surfaceContainerHigh,
                borderColor: selected ? colors.primary : colors.outlineVariant,
                borderRadius: 20,
                borderWidth: 1,
                flex: 1,
                paddingVertical: 14,
              }}>
              <MaterialCommunityIcons
                name={option.icon}
                size={22}
                color={selected ? colors.onPrimary : colors.onSurfaceVariant}
              />
              <AppText
                role="labelLargeEmphasized"
                style={{
                  color: selected ? colors.onPrimary : colors.onSurface,
                  marginTop: 6,
                }}>
                {option.label}
              </AppText>
              <AppText
                role="labelSmall"
                style={{
                  color: selected
                    ? colors.onPrimary
                    : colors.onSurfaceVariant,
                  marginTop: 1,
                  opacity: 0.8,
                }}>
                {option.hint}
              </AppText>
            </TVFocusable>
          );
        })}
      </View>
    </View>
  );
};

export default ThemeModePicker;
