import React, {useMemo} from 'react';
import {View, useColorScheme} from 'react-native';
import {vars} from 'nativewind';
import {M3_COLOR_ROLES, roleToCssVar} from './colors';
import {M3HostThemeContext, M3PaletteContext} from './M3PaletteContext';
import useThemeStore from '../lib/zustand/themeStore';
import {STREAMX_GLASS, STREAMX_PALETTES} from './streamx';
import {resolveStreamXMode} from './useStreamXTheme';
import {SystemBars} from 'react-native-edge-to-edge';

/**
 * StreamX theme provider.
 *
 * Every screen reads colours from `useM3Colors()`, so swapping the palette here
 * re-skins the whole app at once while keeping the existing Material roles
 * intact. The Liquid Glass material itself comes from `useStreamXTheme()`.
 */
export const M3ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const mode = useThemeStore(state => state.mode);
  const systemScheme = useColorScheme();
  const resolved = resolveStreamXMode(mode, systemScheme);

  const palette = useMemo(() => STREAMX_PALETTES[resolved], [resolved]);

  const hostTheme = useMemo(
    () => ({
      colorScheme: resolved,
    }),
    [resolved],
  );

  const style = useMemo(() => {
    const entries: Array<[`--${string}`, string]> = M3_COLOR_ROLES.map(
      role => [roleToCssVar(role), palette[role] as string],
    );
    // Glass tokens are exposed as CSS variables too, so NativeWind styles can
    // reference the same material values as the JS components.
    const glass = STREAMX_GLASS[resolved];
    entries.push(
      ['--streamx-glass-fill' as `--${string}`, glass.fill],
      ['--streamx-glass-border' as `--${string}`, glass.border],
      ['--streamx-glass-strong' as `--${string}`, glass.fillStrong],
    );
    return vars(
      Object.fromEntries(entries) as Record<`--${string}`, string>,
    );
  }, [palette, resolved]);

  // Keep the light palette's ink status bar icons readable on pearl glass.
  const barStyle = resolved === 'light' ? 'dark' : 'light';

  return (
    <M3HostThemeContext.Provider value={hostTheme as never}>
      <M3PaletteContext.Provider value={palette}>
        <SystemBars style={barStyle} />
        <View style={[{flex: 1, backgroundColor: palette.background}, style]}>
          {children}
        </View>
      </M3PaletteContext.Provider>
    </M3HostThemeContext.Provider>
  );
};

export {useM3Colors} from './M3PaletteContext';
