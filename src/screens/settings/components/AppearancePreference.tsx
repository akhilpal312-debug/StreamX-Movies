import React, {useState} from 'react';
import {View} from 'react-native';
import {useM3Colors} from '../../../theme/M3PaletteContext';
import AppText from '../../../components/ui/Text';
import Surface from '../../../components/ui/Surface';
import SettingsSwitchRow from '../../../components/ui/SettingsSwitchRow';
import {settingsStorage} from '../../../lib/storage';

/**
 * Appearance options that actually change the app. Colour modes live in
 * ThemeModePicker; this section covers artwork-driven accents.
 */
const AppearancePreference = () => {
  const colors = useM3Colors();
  const [dynamicInfoAccentEnabled, setDynamicInfoAccentEnabled] = useState(() =>
    settingsStorage.isDynamicInfoAccentEnabled(),
  );

  return (
    <View style={{marginBottom: 24}}>
      <AppText
        role="labelLarge"
        style={{color: colors.onSurfaceVariant, marginBottom: 12}}>
        Artwork
      </AppText>
      <Surface level="low" style={{overflow: 'hidden'}}>
        <SettingsSwitchRow
          title="Dynamic info accent"
          description="Tint the details page with each title's own artwork"
          value={dynamicInfoAccentEnabled}
          onValueChange={enabled => {
            setDynamicInfoAccentEnabled(enabled);
            settingsStorage.setDynamicInfoAccentEnabled(enabled);
          }}
        />
      </Surface>
    </View>
  );
};

export default AppearancePreference;
