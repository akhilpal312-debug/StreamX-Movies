import type {MaterialColors} from './colors';

/**
 * StreamX design tokens.
 *
 * One source of truth for the Liquid Glass identity: palette, glass material
 * recipes, radii, spacing, typography and spring presets. Screens import from
 * here instead of hard-coding colours so light, dark and artwork-adaptive
 * surfaces stay coherent.
 */

export type StreamXThemeMode = 'light' | 'dark' | 'system';

export const STREAMX_BRAND = {
  name: 'StreamX',
  version: '0.1.0',
  tagline: 'Watch • Discover • Enjoy',
  provider: {
    title: 'ZENDA CROSS',
    subtitle: 'Premium Provider Collection',
    author: 'Zenda-Cross',
    repository: 'https://github.com/Zenda-Cross/vega-providers',
    source: 'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main',
  },
} as const;

/** Raw palette values from the reference design. */
export const STREAMX_COLORS = {
  pearl: '#F2F0F3',
  pearlWhite: '#FAF9FB',
  silver: '#C7C7D0',
  ink: '#24232A',
  smoke: '#777580',
  cinematic: '#15151B',
  gold: '#D9C9AD',
  goldDeep: '#B9A47E',
} as const;

const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map(character => character + character).join('')
    : clean;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const withAlpha = hexToRgba;

const lightPalette: MaterialColors = {
  primary: '#24232A',
  onPrimary: '#FAF9FB',
  primaryContainer: '#E7E3D6',
  onPrimaryContainer: '#2B2618',
  inversePrimary: '#D9C9AD',
  secondary: '#4A4854',
  onSecondary: '#FAF9FB',
  secondaryContainer: '#E8E6EC',
  onSecondaryContainer: '#24232A',
  tertiary: '#8A7448',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#EFE7D8',
  onTertiaryContainer: '#3B3016',
  background: '#F2F0F3',
  onBackground: '#24232A',
  surface: '#FAF9FB',
  onSurface: '#24232A',
  surfaceVariant: '#E9E7EC',
  onSurfaceVariant: '#777580',
  surfaceTint: '#24232A',
  inverseSurface: '#24232A',
  inverseOnSurface: '#F7F6F9',
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  outline: '#B9B6C1',
  outlineVariant: '#E2E0E6',
  scrim: '#000000',
  surfaceBright: '#FFFFFF',
  surfaceDim: '#E4E2E8',
  surfaceContainer: '#EFEDF1',
  surfaceContainerHigh: '#F6F5F8',
  surfaceContainerHighest: '#FFFFFF',
  surfaceContainerLow: '#F4F2F6',
  surfaceContainerLowest: '#FCFBFD',
  primaryFixed: '#24232A',
  primaryFixedDim: '#3A3942',
  onPrimaryFixed: '#FAF9FB',
  onPrimaryFixedVariant: '#4A4854',
  secondaryFixed: '#D9C9AD',
  secondaryFixedDim: '#C7B99C',
  onSecondaryFixed: '#2B2618',
  onSecondaryFixedVariant: '#6B5B3A',
  tertiaryFixed: '#EFE7D8',
  tertiaryFixedDim: '#D9C9AD',
  onTertiaryFixed: '#2B2618',
  onTertiaryFixedVariant: '#6B5B3A',
};

const darkPalette: MaterialColors = {
  primary: '#EDE9E2',
  onPrimary: '#1A1A20',
  primaryContainer: '#2E2C2A',
  onPrimaryContainer: '#F3EFE6',
  inversePrimary: '#24232A',
  secondary: '#CFCBD6',
  onSecondary: '#1A1A20',
  secondaryContainer: '#2B2A33',
  onSecondaryContainer: '#F1EFF4',
  tertiary: '#D9C9AD',
  onTertiary: '#2B2618',
  tertiaryContainer: '#3A3325',
  onTertiaryContainer: '#F1E7D3',
  background: '#15151B',
  onBackground: '#F4F2F6',
  surface: '#18181E',
  onSurface: '#F4F2F6',
  surfaceVariant: '#2A2831',
  onSurfaceVariant: '#AAA6B3',
  surfaceTint: '#EDE9E2',
  inverseSurface: '#F4F2F6',
  inverseOnSurface: '#24232A',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  outline: '#6A6774',
  outlineVariant: '#35333D',
  scrim: '#000000',
  surfaceBright: '#353340',
  surfaceDim: '#111116',
  surfaceContainer: '#1E1D24',
  surfaceContainerHigh: '#25242C',
  surfaceContainerHighest: '#2C2B35',
  surfaceContainerLow: '#1A191F',
  surfaceContainerLowest: '#121217',
  primaryFixed: '#EDE9E2',
  primaryFixedDim: '#CFCBC4',
  onPrimaryFixed: '#1A1A20',
  onPrimaryFixedVariant: '#3A3942',
  secondaryFixed: '#D9C9AD',
  secondaryFixedDim: '#B9A47E',
  onSecondaryFixed: '#2B2618',
  onSecondaryFixedVariant: '#6B5B3A',
  tertiaryFixed: '#EFE7D8',
  tertiaryFixedDim: '#D9C9AD',
  onTertiaryFixed: '#2B2618',
  onTertiaryFixedVariant: '#6B5B3A',
};

export const STREAMX_PALETTES: Record<'light' | 'dark', MaterialColors> = {
  light: lightPalette,
  dark: darkPalette,
};

export type GlassTokens = {
  /** Fill laid over the blurred backdrop. */
  fill: string;
  /** Stronger fill for floating chrome such as the tab bar. */
  fillStrong: string;
  /** Hairline highlight around the top edge. */
  border: string;
  borderSoft: string;
  /** Specular sheen gradient stops. */
  sheen: [string, string, string];
  /** Bottom inner reflection. */
  reflection: string;
  shadow: string;
  shadowOpacity: number;
  tint: 'light' | 'dark';
  blurIntensity: number;
  /** Used where blur is unavailable or disabled. */
  fallback: string;
  scrim: string;
};

export const STREAMX_GLASS: Record<'light' | 'dark', GlassTokens> = {
  light: {
    fill: 'rgba(255,255,255,0.48)',
    fillStrong: 'rgba(255,255,255,0.62)',
    border: 'rgba(255,255,255,0.72)',
    borderSoft: 'rgba(255,255,255,0.42)',
    sheen: [
      'rgba(255,255,255,0.62)',
      'rgba(255,255,255,0.08)',
      'rgba(255,255,255,0.26)',
    ],
    reflection: 'rgba(217,201,173,0.20)',
    shadow: '#7A7686',
    shadowOpacity: 0.16,
    tint: 'light',
    blurIntensity: 46,
    fallback: 'rgba(250,249,251,0.92)',
    scrim: 'rgba(21,21,27,0.32)',
  },
  dark: {
    fill: 'rgba(255,255,255,0.07)',
    fillStrong: 'rgba(24,24,30,0.72)',
    border: 'rgba(255,255,255,0.18)',
    borderSoft: 'rgba(255,255,255,0.08)',
    sheen: [
      'rgba(255,255,255,0.16)',
      'rgba(255,255,255,0.02)',
      'rgba(217,201,173,0.10)',
    ],
    reflection: 'rgba(217,201,173,0.14)',
    shadow: '#000000',
    shadowOpacity: 0.45,
    tint: 'dark',
    blurIntensity: 38,
    fallback: 'rgba(30,29,36,0.94)',
    scrim: 'rgba(0,0,0,0.5)',
  },
};

export const STREAMX_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const STREAMX_RADII = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  xxl: 38,
  pill: 999,
} as const;

export const STREAMX_TYPE = {
  logo: {fontSize: 26, fontWeight: '700', letterSpacing: -0.4},
  hero: {fontSize: 34, lineHeight: 38, fontWeight: '800'},
  section: {fontSize: 20, lineHeight: 26, fontWeight: '700'},
  cardTitle: {fontSize: 14, lineHeight: 18, fontWeight: '600'},
  meta: {fontSize: 12, lineHeight: 16, fontWeight: '500'},
  body: {fontSize: 15, lineHeight: 22, fontWeight: '400'},
  label: {fontSize: 13, lineHeight: 18, fontWeight: '600'},
  eyebrow: {fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1},
} as const;

/**
 * Spring-damper presets. Conceptually F = -kx - cv: `stiffness` is k,
 * `damping` is c and `mass` scales inertia. Values are tuned for glass that
 * feels weighted but never sluggish.
 */
export const LIQUID_SPRINGS = {
  press: {damping: 22, stiffness: 420, mass: 0.7},
  release: {damping: 16, stiffness: 260, mass: 0.9},
  settle: {damping: 20, stiffness: 180, mass: 1},
  sheet: {damping: 26, stiffness: 240, mass: 1},
  nav: {damping: 18, stiffness: 210, mass: 0.9},
} as const;

/** Shadow recipe for floating glass surfaces. */
export const glassShadow = (
  mode: 'light' | 'dark',
  elevation = 1,
): {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: {width: number; height: number};
  elevation: number;
} => {
  const glass = STREAMX_GLASS[mode];
  return {
    shadowColor: glass.shadow,
    shadowOpacity: glass.shadowOpacity * elevation,
    shadowRadius: 18 * elevation,
    shadowOffset: {width: 0, height: 10 * elevation},
    elevation: Math.round(6 * elevation),
  };
};
