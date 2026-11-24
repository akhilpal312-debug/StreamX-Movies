import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Pressable, useWindowDimensions, View} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {settingsStorage} from '../../lib/storage';
import {useM3Colors} from '../../theme/M3PaletteContext';
import AppText from '../ui/Text';
import {AnimatedTabIcon, type AnimatedTabIconName} from './AnimatedTabIcon';
import {isTV} from '../../lib/tv/constants';
import {useTVFocusBorderColor} from '../../lib/tv/useTVFocusBorderColor';
import GlassSurface from '../glass/GlassSurface';
import {STREAMX_RADII, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';

const TAB_ICONS: Record<string, AnimatedTabIconName> = {
  HomeStack: 'home',
  SearchStack: 'search',
  WatchListStack: 'watchlist',
  DownloadsStack: 'download',
  SettingsStack: 'settings',
};

const TAB_LABELS: Record<string, string> = {
  HomeStack: 'Home',
  SearchStack: 'Search',
  WatchListStack: 'My List',
  DownloadsStack: 'Downloads',
  SettingsStack: 'Settings',
};

import {TVFocusable} from '../tv';

import useTVNavigationStore from '../../lib/zustand/tvNavigationStore';

const BAR_HEIGHT = 66;

const StreamingTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const colors = useM3Colors();
  const {mode} = useStreamXTheme();
  const insets = useSafeAreaInsets();
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  const isNavigationRail = isTV || Math.min(windowWidth, windowHeight) >= 600;
  const showLabels = settingsStorage.showTabBarLabels();
  const activeTabKey = state.routes[state.index]?.key ?? null;
  const visibleRoutes = state.routes;

  React.useLayoutEffect(() => {
    if (isTV) useTVNavigationStore.getState().setActiveTabKey(activeTabKey);
  }, [activeTabKey]);

  const renderButton = (route: (typeof state.routes)[number], index: number) => {
    const descriptor = descriptors[route.key];
    const focused = state.index === index;
    const label =
      typeof descriptor.options.tabBarLabel === 'string'
        ? descriptor.options.tabBarLabel
        : TAB_LABELS[route.name] ??
          (typeof descriptor.options.title === 'string'
            ? descriptor.options.title
            : route.name);
    const icon = TAB_ICONS[route.name] ?? 'home';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        if (settingsStorage.isHapticFeedbackEnabled()) {
          ReactNativeHapticFeedback.trigger('effectTick', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
        navigation.navigate(route.name, route.params);
      }
    };

    if (isNavigationRail) {
      const focusBorderColor = useTVFocusBorderColor();
      return (
        <TVFocusable
          key={route.key}
          accessibilityRole="button"
          accessibilityState={focused ? {selected: true} : {}}
          accessibilityLabel={label}
          onPress={onPress}
          borderRadius={18}
          focusScale={1.06}
          focusBorderColor={focusBorderColor}
          style={{
            alignItems: 'center',
            borderRadius: 18,
            height: showLabels ? 72 : 52,
            justifyContent: 'center',
            width: 76,
          }}>
          {({focused: tvFocused}) => (
            <View style={{alignItems: 'center'}}>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor:
                    focused || tvFocused
                      ? colors.primary
                      : 'rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  height: 36,
                  justifyContent: 'center',
                  width: 52,
                }}>
                <AnimatedTabIcon
                  name={icon}
                  active={focused || tvFocused}
                  color={
                    focused || tvFocused
                      ? colors.onPrimary
                      : colors.onSurfaceVariant
                  }
                  size={22}
                />
              </View>
              {showLabels ? (
                <AppText
                  role="labelSmallEmphasized"
                  numberOfLines={1}
                  style={{
                    color: focused ? colors.onSurface : colors.onSurfaceVariant,
                    fontSize: 11,
                    marginTop: 5,
                  }}>
                  {label}
                </AppText>
              ) : null}
            </View>
          )}
        </TVFocusable>
      );
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? {selected: true} : {}}
        accessibilityLabel={descriptor.options.tabBarAccessibilityLabel ?? label}
        onPress={onPress}
        onLongPress={() =>
          navigation.emit({type: 'tabLongPress', target: route.key})
        }
        style={{
          alignItems: 'center',
          flex: 1,
          height: BAR_HEIGHT,
          justifyContent: 'center',
        }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: focused ? colors.primary : 'transparent',
            borderRadius: 13,
            height: 34,
            justifyContent: 'center',
            width: 46,
          }}>
          <AnimatedTabIcon
            name={icon}
            active={focused}
            color={focused ? colors.onPrimary : colors.onSurfaceVariant}
            size={21}
          />
        </View>
        {showLabels ? (
          <AppText
            numberOfLines={1}
            style={{
              color: focused ? colors.onSurface : colors.onSurfaceVariant,
              fontSize: 10.5,
              fontWeight: focused ? '700' : '500',
              letterSpacing: 0.1,
              marginTop: 3,
            }}>
            {label}
          </AppText>
        ) : null}
      </Pressable>
    );
  };

  if (isNavigationRail) {
    return (
      <GlassSurface
        variant="chrome"
        radius={STREAMX_RADII.lg}
        elevated={false}
        style={{
          height: '100%',
          paddingBottom: Math.max(insets.bottom, 12),
          paddingLeft: insets.left + 8,
          paddingTop: Math.max(insets.top, 20),
          width: 92 + insets.left,
        }}
        contentStyle={{flex: 1}}>
        <View
          style={{
            alignItems: 'center',
            flex: 1,
            gap: 8,
            justifyContent: 'center',
          }}>
          {visibleRoutes.map(renderButton)}
        </View>
      </GlassSurface>
    );
  }

  return (
    <View
      style={{
        backgroundColor: 'transparent',
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 14,
        paddingTop: 6,
      }}>
      <GlassSurface
        variant="chrome"
        radius={STREAMX_RADII.xxl}
        tinted
        style={[glassShadow(mode, 1.15), {borderRadius: STREAMX_RADII.xxl}]}
        contentStyle={{height: BAR_HEIGHT}}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            marginHorizontal: 4,
          }}>
          {visibleRoutes.map(renderButton)}
        </View>
      </GlassSurface>
    </View>
  );
};

export default StreamingTabBar;
