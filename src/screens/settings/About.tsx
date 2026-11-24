import {View, ScrollView, ToastAndroid, Linking, BackHandler} from 'react-native';
import React, {useState, useCallback} from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import SettingsRow from '../../components/ui/SettingsRow';
import AppText from '../../components/ui/Text';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {TVFocusGuide} from '../../components/tv';
import {isTV} from '../../lib/tv';
import {
  isDetailedLoggingEnabled,
  setDetailedLogging,
  shareLogs,
  clearLogs,
} from '../../lib/logging/vegaLog';
import {useRemoteStore} from '../../lib/remote/remoteStore';
import {useFocusEffect} from '@react-navigation/native';
import GlassSurface from '../../components/glass/GlassSurface';
import StreamXLogo from '../../components/glass/StreamXLogo';
import {STREAMX_BRAND, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';
import {DEFAULT_PROVIDER_REPOSITORY} from '../../lib/constants';

const LICENSES: Array<{name: string; license: string; url: string}> = [
  {
    name: 'React Native',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native/blob/main/LICENSE',
  },
  {
    name: 'Expo',
    license: 'MIT',
    url: 'https://github.com/expo/expo/blob/main/LICENSE',
  },
  {
    name: 'react-native-video',
    license: 'MIT',
    url: 'https://github.com/TheWidlarzGroup/react-native-video/blob/master/LICENSE',
  },
  {
    name: 'React Native Reanimated',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-reanimated/blob/main/LICENSE',
  },
  {
    name: 'React Navigation',
    license: 'MIT',
    url: 'https://github.com/react-navigation/react-navigation/blob/main/LICENSE',
  },
  {
    name: 'Zustand',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand/blob/main/LICENSE',
  },
];

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

const About = ({navigation}: any) => {
  const colors = useM3Colors();
  const {mode} = useStreamXTheme();
  const [detailedLogging, setDetailedLoggingState] = useState(
    isDetailedLoggingEnabled,
  );
  const [exportingLogs, setExportingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const handleClearLogs = async () => {
    setClearingLogs(true);
    try {
      await clearLogs();
      ToastAndroid.show('Logs cleared', ToastAndroid.SHORT);
    } catch (error: any) {
      ToastAndroid.show(error?.message || 'Could not clear logs', ToastAndroid.SHORT);
    } finally {
      setClearingLogs(false);
    }
  };

  const exportLogs = async () => {
    setExportingLogs(true);
    try {
      const device = useRemoteStore.getState().connectedDevice;
      await shareLogs(
        device
          ? `Receiver ${device.type}: ${[device.manufacturer, device.model, device.name]
              .filter(Boolean)
              .join(' ')}`
          : undefined,
      );
    } catch (error: any) {
      ToastAndroid.show(
        error?.message || 'Could not export logs',
        ToastAndroid.SHORT,
      );
    } finally {
      setExportingLogs(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isTV) {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (navigation?.canGoBack?.()) {
          navigation.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [navigation]),
  );

  return (
    <TVFocusGuide autoFocus={true} trapFocusRight={true} trapFocusDown={true} style={{flex: 1}}>
      <ScrollView
        focusable={false}
        accessible={false}
        style={{flex: 1, backgroundColor: colors.background}}
        contentContainerStyle={{padding: 20, paddingBottom: 44}}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            marginBottom: 18,
          }}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.onBackground}
            onPress={() => navigation.goBack()}
            style={{marginRight: 10, padding: 4}}
          />
          <AppText
            role="headlineLargeEmphasized"
            style={{color: colors.onBackground, fontSize: 28, fontWeight: '800'}}>
            About StreamX
          </AppText>
        </View>

        <GlassSurface
          variant="panel"
          radius={26}
          tinted
          style={[glassShadow(mode, 1), {marginBottom: 22}]}
          contentStyle={{alignItems: 'center', paddingVertical: 22}}>
          <StreamXLogo variant="full" size={78} />
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
          <AppText style={{color: colors.onSurfaceVariant, fontSize: 12, marginTop: 3}}>
            v{STREAMX_BRAND.version} • {STREAMX_BRAND.tagline}
          </AppText>
        </GlassSurface>

        <Section title="App">
          <SettingsRow
            title="Version"
            description={`StreamX ${Application.nativeApplicationVersion || STREAMX_BRAND.version}`}
            icon="information-outline"
          />
          <SettingsRow
            title="Package"
            description={
              Application.applicationId ||
              Constants.expoConfig?.android?.package ||
              'com.vega'
            }
            icon="android"
          />
          <SettingsRow
            title="Provider collection"
            description="Zenda Cross • open the provider repository"
            icon="puzzle-outline"
            divider={false}
            onPress={() => Linking.openURL(DEFAULT_PROVIDER_REPOSITORY)}
          />
        </Section>

        <Section title="Open-source licenses">
          {LICENSES.map((item, index) => (
            <SettingsRow
              key={item.name}
              title={item.name}
              description={`${item.license} license`}
              icon="license"
              divider={index !== LICENSES.length - 1}
              onPress={() => Linking.openURL(item.url)}
            />
          ))}
        </Section>

        {!isTV && (
          <Section title="Troubleshooting">
            <SettingsRow
              title="Detailed logging"
              description={
                detailedLogging
                  ? 'On • records extra detail for bug reports'
                  : 'Records more detail for bug reports'
              }
              icon="text-box-search-outline"
              trailing={
                <MaterialCommunityIcons
                  name={detailedLogging ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  size={30}
                  color={detailedLogging ? colors.primary : colors.onSurfaceVariant}
                />
              }
              onPress={() => {
                const next = !detailedLogging;
                setDetailedLoggingState(next);
                setDetailedLogging(next);
              }}
            />
            <SettingsRow
              title="Export logs"
              description="Share recent app logs. Links and sign-in data are removed."
              icon="file-document-outline"
              trailing={
                exportingLogs ? <LoadingIndicator size={14} /> : undefined
              }
              onPress={exportingLogs || clearingLogs ? undefined : exportLogs}
            />
            <SettingsRow
              title="Clear logs"
              description="Clear old logs before reproducing a problem."
              icon="delete-outline"
              divider={false}
              trailing={clearingLogs ? <LoadingIndicator size={14} /> : undefined}
              onPress={clearingLogs || exportingLogs ? undefined : handleClearLogs}
            />
          </Section>
        )}

        <AppText
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 11,
            lineHeight: 16,
            textAlign: 'center',
          }}>
          StreamX is built on the open-source Vega player architecture. Provider
          modules are executable code reviewed by their authors; install only
          sources you trust.
        </AppText>
      </ScrollView>
    </TVFocusGuide>
  );
};

export default About;
