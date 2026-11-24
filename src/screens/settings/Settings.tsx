import ScreenSafeArea from '../../components/ui/ScreenSafeArea';
import {View, ScrollView} from 'react-native';
import React from 'react';
import {settingsStorage} from '../../lib/storage';
import useContentStore from '../../lib/zustand/contentStore';
import {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {SettingsStackParamList, TabStackParamList} from '../../App';
import {MaterialIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import SettingsRow from '../../components/ui/SettingsRow';
import AppText from '../../components/ui/Text';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {TVFocusGuide} from '../../components/tv';
import {isTV} from '../../lib/tv';
import GlassSurface from '../../components/glass/GlassSurface';
import StreamXLogo from '../../components/glass/StreamXLogo';
import ThemeModePicker from './components/ThemeModePicker';
import DnsPreference from './components/DnsPreference';
import useThemeStore from '../../lib/zustand/themeStore';
import {STREAMX_BRAND, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const colors = useM3Colors();
  return (
    <View style={{marginBottom: 22}}>
      <AppText
        role="labelLarge"
        style={{
          color: colors.onSurfaceVariant,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.8,
          marginBottom: 10,
        }}>
        {title.toUpperCase()}
      </AppText>
      <GlassSurface variant="panel" radius={24} contentStyle={{overflow: 'hidden'}}>
        {children}
      </GlassSurface>
    </View>
  );
};

const Settings = ({navigation}: Props) => {
  const tabNavigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const colors = useM3Colors();
  const {mode} = useStreamXTheme();
  const themeMode = useThemeStore(state => state.mode);
  const provider = useContentStore(state => state.provider);
  const hideDownloadsTab = settingsStorage.hideDownloadsTab();

  return (
    <ScreenSafeArea style={{backgroundColor: colors.background}}>
      <TVFocusGuide autoFocus={true} trapFocusRight={true} trapFocusDown={true} style={{flex: 1}}>
        <ScrollView
          focusable={false}
          accessible={false}
          style={{backgroundColor: colors.background, flex: 1}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
            paddingHorizontal: 20,
            paddingTop: isTV ? 20 : 10,
          }}>
          <AppText
            role="headlineLargeEmphasized"
            style={{
              color: colors.onBackground,
              fontSize: 30,
              fontWeight: '800',
              letterSpacing: -0.6,
              marginBottom: 16,
              marginTop: 4,
            }}>
            Settings
          </AppText>

          {/* Brand card */}
          <GlassSurface
            variant="panel"
            radius={26}
            tinted
            style={[glassShadow(mode, 1), {marginBottom: 22}]}
            contentStyle={{alignItems: 'center', paddingVertical: 22}}>
            <StreamXLogo variant="full" size={72} />
            <AppText
              role="titleLargeEmphasized"
              style={{
                color: colors.onSurface,
                fontSize: 20,
                fontWeight: '800',
                marginTop: 6,
              }}>
              StreamX
            </AppText>
            <AppText
              role="labelMedium"
              style={{color: colors.onSurfaceVariant, marginTop: 2}}>
              v{STREAMX_BRAND.version} • {STREAMX_BRAND.tagline}
            </AppText>
          </GlassSurface>

          <ThemeModePicker />

          <Section title="Content">
            <SettingsRow
              title="Provider Manager"
              description={
                provider?.display_name
                  ? `Active: ${provider.display_name}`
                  : 'Install Zenda Cross providers and manage sources'
              }
              icon="puzzle-outline"
              onPress={() => navigation.navigate('Extensions')}
            />
            <SettingsRow
              title="My provider"
              description={provider?.display_name || 'No provider installed yet'}
              icon="account-check-outline"
              trailing={
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              }
              divider={false}
              onPress={() => tabNavigation.navigate('HomeStack')}
            />
          </Section>

          <Section title="Playback">
            <SettingsRow
              title="Player settings"
              description="Quality, buffer, gestures and controls"
              icon="play-circle-outline"
              onPress={() => navigation.navigate('PlayerSettings')}
            />
            <SettingsRow
              title="Subtitle settings"
              description="Font, size and styling for subtitles"
              icon="subtitles-outline"
              onPress={() => navigation.navigate('SubTitlesPreferences')}
            />
            <SettingsRow
              title="Downloads"
              description="Download location, connections and queue"
              icon="download-outline"
              onPress={() =>
                hideDownloadsTab
                  ? navigation.navigate('DownloadsStack')
                  : tabNavigation.navigate('DownloadsStack')
              }
            />
            <SettingsRow
              title="Appearance"
              description={`${
                themeMode === 'system' ? 'Automatic' : themeMode === 'dark' ? 'Dark cinematic' : 'Light pearl'
              } • accents and launcher icon`}
              icon="palette-outline"
              divider={false}
              onPress={() => navigation.navigate('Appearance')}
            />
          </Section>

          <Section title="Network">
            <DnsPreference />
          </Section>

          <Section title="Data">
            <SettingsRow
              title="Data management"
              description="Backups, cache, watch progress and sync"
              icon="database-outline"
              divider={false}
              onPress={() => navigation.navigate('DataManagement')}
            />
          </Section>

          <Section title="About">
            <SettingsRow
              title="About StreamX"
              description={`Version ${STREAMX_BRAND.version} and open-source licenses`}
              icon="information-outline"
              divider={false}
              onPress={() => navigation.navigate('About')}
            />
          </Section>
        </ScrollView>
      </TVFocusGuide>
    </ScreenSafeArea>
  );
};

export default Settings;
