import {useColorScheme} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import {
  STREAMX_GLASS,
  STREAMX_PALETTES,
  type GlassTokens,
} from './streamx';
import type {MaterialColors} from './colors';

export type ResolvedStreamXMode = 'light' | 'dark';

export type StreamXTheme = {
  mode: ResolvedStreamXMode;
  colors: MaterialColors;
  glass: GlassTokens;
};

/**
 * Resolves the persisted StreamX mode against the device scheme.
 * Kept as a plain function so any non-component code (hooks, effects) can ask
 * for the active theme without subscribing.
 */
export const resolveStreamXMode = (
  mode: 'light' | 'dark' | 'system',
  systemScheme: string | null | undefined,
): ResolvedStreamXMode =>
  mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

export const getStreamXTheme = (
  mode: ResolvedStreamXMode,
): StreamXTheme => ({
  mode,
  colors: STREAMX_PALETTES[mode],
  glass: STREAMX_GLASS[mode],
});

/** Components use this instead of importing the whole theme provider. */
export const useStreamXTheme = (): StreamXTheme => {
  const storedMode = useThemeStore(state => state.mode);
  const systemScheme = useColorScheme();
  return getStreamXTheme(resolveStreamXMode(storedMode, systemScheme));
};
