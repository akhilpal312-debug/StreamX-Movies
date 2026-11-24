import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {View, BackHandler} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import useContentStore from '../lib/zustand/contentStore';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useM3Colors} from '../theme/M3PaletteContext';
import {isTV} from '../lib/tv';
import {TVFocusable} from './tv';
import ProviderIcon from './ProviderIcon';
import AppText from './ui/Text';
import StreamXLogo from './glass/StreamXLogo';
import LiquidPressable from './glass/LiquidPressable';
import {STREAMX_BRAND} from '../theme/streamx';
import {useStreamXTheme} from '../theme/useStreamXTheme';
import type {TabStackParamList} from '../App';

interface ProviderDrawerProps {
  onClose: () => void;
  /** The mobile drawer renders its content while closed. */
  isOpen?: boolean;
  onSelectProvider?: (
    provider: import('../lib/storage/extensionStorage').ProviderExtension,
  ) => void;
}

type DrawerItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
};

const DrawerRow = ({
  item,
  onClose,
}: {
  item: DrawerItem;
  onClose: () => void;
}) => {
  const colors = useM3Colors();
  const {glass} = useStreamXTheme();
  const content = (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.34)',
          borderColor: glass.borderSoft,
          borderRadius: 12,
          borderWidth: 1,
          height: 34,
          justifyContent: 'center',
          marginRight: 12,
          width: 34,
        }}>
        <MaterialCommunityIcons
          name={item.icon}
          size={18}
          color={colors.onSurface}
        />
      </View>
      <AppText
        numberOfLines={1}
        style={{color: colors.onSurface, flex: 1, fontSize: 15, fontWeight: '600'}}>
        {item.label}
      </AppText>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.onSurfaceVariant}
      />
    </View>
  );

  if (isTV) {
    return (
      <TVFocusable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        onPress={() => {
          item.onPress();
        }}
        borderRadius={16}
        focusScale={1.02}
        style={{borderRadius: 16}}>
        {content}
      </TVFocusable>
    );
  }

  return (
    <LiquidPressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      radius={16}
      onPress={() => {
        item.onPress();
        onClose();
      }}>
      {content}
    </LiquidPressable>
  );
};

/**
 * StreamX navigation drawer. Keeps the provider switcher (the app's core
 * content-source control) underneath the app navigation so every destination
 * listed here is a real, working screen.
 */
const ProviderDrawer = ({
  onClose,
  isOpen = true,
  onSelectProvider,
}: ProviderDrawerProps) => {
  const colors = useM3Colors();
  const {glass} = useStreamXTheme();
  const provider = useContentStore(state => state.provider);
  const setProvider = useContentStore(state => state.setProvider);
  const installedProviders = useContentStore(state => state.installedProviders);
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const mountTimeRef = React.useRef<number>(Date.now());

  const handleClose = React.useCallback(() => {
    if (Date.now() - mountTimeRef.current < 350) return;
    onClose();
  }, [onClose]);

  const selectProvider = React.useCallback(
    (item: any) => {
      if (onSelectProvider) onSelectProvider(item);
      else {
        setProvider(item);
        onClose();
      }
    },
    [onSelectProvider, onClose, setProvider],
  );

  useEffect(() => {
    // A closed drawer must not swallow back presses for the whole app.
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose, isOpen]);

  const items: DrawerItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: 'home-variant-outline',
      onPress: () => navigation.navigate('HomeStack'),
    },
    {
      key: 'search',
      label: 'Discover',
      icon: 'magnify',
      onPress: () => navigation.navigate('SearchStack'),
    },
    {
      key: 'library',
      label: 'My List',
      icon: 'bookmark-multiple-outline',
      onPress: () => navigation.navigate('WatchListStack'),
    },
    {
      key: 'downloads',
      label: 'Downloads',
      icon: 'download-outline',
      onPress: () => navigation.navigate('DownloadsStack'),
    },
    {
      key: 'providers',
      label: 'Providers',
      icon: 'puzzle-outline',
      onPress: () =>
        navigation.navigate('SettingsStack', {screen: 'Extensions'} as never),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'cog-outline',
      onPress: () => navigation.navigate('SettingsStack'),
    },
    {
      key: 'about',
      label: 'About StreamX',
      icon: 'information-outline',
      onPress: () =>
        navigation.navigate('SettingsStack', {screen: 'About'} as never),
    },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.background,
        flex: 1,
        paddingTop: insets.top + 8,
      }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 10,
        }}>
        <View>
          <StreamXLogo variant="lockup" size={22} />
          <AppText
            role="labelSmall"
            style={{
              color: colors.onSurfaceVariant,
              marginTop: 3,
              letterSpacing: 0.6,
            }}>
            v{STREAMX_BRAND.version}
          </AppText>
        </View>
        {!isTV ? (
          <LiquidPressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={handleClose}
            radius={20}
            haptic={false}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: glass.fillStrong,
                borderColor: glass.border,
                borderRadius: 20,
                borderWidth: 1,
                height: 38,
                justifyContent: 'center',
                width: 38,
              }}>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.onSurface}
              />
            </View>
          </LiquidPressable>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: glass.borderSoft,
          height: 1,
          marginHorizontal: 18,
          marginVertical: 8,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
        <View style={{paddingHorizontal: 10, paddingTop: 4}}>
          {items.map(item => (
            <DrawerRow key={item.key} item={item} onClose={onClose} />
          ))}
        </View>

        <View
          style={{
            backgroundColor: glass.borderSoft,
            height: 1,
            marginHorizontal: 18,
            marginVertical: 12,
          }}
        />

        <View style={{paddingHorizontal: 18, paddingBottom: 14}}>
          <AppText
            role="labelSmallEmphasized"
            style={{
              color: colors.onSurfaceVariant,
              letterSpacing: 1.2,
              marginBottom: 8,
            }}>
            CONTENT SOURCE
          </AppText>
          {installedProviders.length === 0 ? (
            <AppText
              role="bodySmall"
              style={{color: colors.onSurfaceVariant}}>
              No providers installed yet. Open Providers to install Zenda Cross
              providers.
            </AppText>
          ) : (
            installedProviders.map(item => {
              const selected = provider.value === item.value;
              return (
                <LiquidPressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${item.display_name}`}
                  accessibilityState={{selected}}
                  radius={14}
                  onPress={() => selectProvider(item)}
                  haptic={false}>
                  <View
                    style={{
                      alignItems: 'center',
                      borderColor: selected
                        ? colors.primary
                        : 'transparent',
                      borderRadius: 14,
                      borderWidth: 1.5,
                      flexDirection: 'row',
                      marginBottom: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                    }}>
                    <ProviderIcon
                      uri={item.icon}
                      name={item.display_name}
                      size={22}
                      background="rgba(255,255,255,0.35)"
                      color={selected ? colors.primary : colors.onSurfaceVariant}
                    />
                    <AppText
                      numberOfLines={1}
                      style={{
                        color: selected ? colors.onSurface : colors.onSurfaceVariant,
                        flex: 1,
                        fontSize: 14,
                        fontWeight: selected ? '700' : '500',
                        marginLeft: 10,
                      }}>
                      {item.display_name}
                    </AppText>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={colors.primary}
                      />
                    ) : null}
                  </View>
                </LiquidPressable>
              );
            })
          )}
        </View>
        <View style={{height: insets.bottom + 24}} />
      </ScrollView>
    </View>
  );
};

export default ProviderDrawer;
