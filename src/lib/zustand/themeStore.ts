import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {settingsStorage} from '../storage';

const storage = new MMKVLoader().initialize();

export type AccentSource = 'wallpaper' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  primary: string;
  isCustom: boolean;
  /** Where the palette comes from: the device wallpaper or a curated seed. */
  source: AccentSource;
  /** StreamX appearance mode. Light is the pearl liquid-glass identity. */
  mode: ThemeMode;
  setPrimary: (type: Theme['primary']) => void;
  setCustom: (isCustom: boolean) => void;
  setSource: (source: AccentSource) => void;
  setMode: (mode: ThemeMode) => void;
}

const useThemeStore = create<Theme>()(
  persist(
    set => ({
      primary: settingsStorage.getPrimaryColor(),
      isCustom: settingsStorage.isCustomTheme(),
      source: settingsStorage.getAccentSource(),
      mode: settingsStorage.getThemeMode(),

      setPrimary: (primary: Theme['primary']) => {
        set({primary});
        settingsStorage.setPrimaryColor(primary);
      },
      setCustom: (isCustom: Theme['isCustom']) => {
        set({isCustom});
        settingsStorage.setCustomTheme(isCustom);
      },
      setSource: (source: AccentSource) => {
        set({source});
        settingsStorage.setAccentSource(source);
      },
      setMode: (mode: ThemeMode) => {
        set({mode});
        settingsStorage.setThemeMode(mode);
      },
    }),
    {
      name: 'theme-storage',
      //@ts-expect-error
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useThemeStore;
