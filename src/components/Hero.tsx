import {normalizeContentTags} from '../lib/contentTags';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useWindowDimensions,
  AppState,
  Image,
  Modal,
  Pressable,
  View,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {HomeStackParamList} from '../App';
import {useHeroMetadata, useHeroRotation} from '../lib/hooks/useHomePageData';
import useContentStore from '../lib/zustand/contentStore';
import useHeroStore from '../lib/zustand/herostore';
import useWatchListStore from '../lib/zustand/watchListStore';
import {useM3Colors} from '../theme/M3PaletteContext';
import {
  fetchIMDbSuggestions,
  type IMDbSuggestion,
} from '../lib/services/imdbSuggestions';
import {sanitizeSearchQuery} from '../lib/utils/helpers';
import SearchSuggestions from './search/SearchSuggestions';
import SearchField, {type SearchFieldRef} from './ui/SearchField';
import AppText from './ui/Text';
import {isTV} from '../lib/tv';
import {TVFocusable} from './tv';
import {useTVFocusBorderColor} from '../lib/tv/useTVFocusBorderColor';
import StreamXLogo from './glass/StreamXLogo';
import LiquidPressable from './glass/LiquidPressable';
import GlassSurface from './glass/GlassSurface';
import {LIQUID_SPRINGS, STREAMX_RADII, glassShadow} from '../theme/streamx';
import {useStreamXTheme} from '../theme/useStreamXTheme';

interface HeroProps {
  isDrawerOpen: boolean;
  isVisible?: boolean;
  onOpenDrawer: () => void;
}

const HERO_CARD_HEIGHT = 412;
const HERO_CONTENT_BOTTOM = 26;

const useAppActive = () => {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setActive(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  return active;
};

const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Round glass chrome button used for search and drawer. */
const HeaderButton = ({
  icon,
  label,
  onPress,
  preferredFocus,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  preferredFocus?: boolean;
}) => {
  const focusBorderColor = useTVFocusBorderColor();
  const {colors, glass} = useStreamXTheme();

  if (isTV) {
    return (
      <TVFocusable
        accessibilityRole="button"
        accessibilityLabel={label}
        hasTVPreferredFocus={preferredFocus}
        onPress={onPress}
        borderRadius={24}
        focusScale={1.12}
        focusBorderColor={focusBorderColor}
        style={{height: 44, width: 44, borderRadius: 22}}>
        {({focused}) => (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: focused ? colors.surfaceContainerHighest : glass.fillStrong,
              borderColor: glass.border,
              borderRadius: 22,
              borderWidth: 1,
              height: 44,
              justifyContent: 'center',
              width: 44,
            }}>
            <MaterialCommunityIcons name={icon} size={21} color={colors.onSurface} />
          </View>
        )}
      </TVFocusable>
    );
  }

  return (
    <LiquidPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      radius={22}
      style={glassShadow('light', 0.4)}>
      <GlassSurface variant="chip" radius={22} elevated={false} style={{height: 44, width: 44}}>
        <View style={{alignItems: 'center', height: 44, justifyContent: 'center', width: 44}}>
          <MaterialCommunityIcons name={icon} size={21} color={colors.onSurface} />
        </View>
      </GlassSurface>
    </LiquidPressable>
  );
};

/** Primary artwork pill: pearl fill over the movie still. */
const HeroAction = ({
  label,
  icon,
  onPress,
  tone,
  preferredFocus,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  tone: 'pearl' | 'glass';
  preferredFocus?: boolean;
}) => {
  const focusBorderColor = useTVFocusBorderColor();
  const {glass} = useStreamXTheme();
  const isPearl = tone === 'pearl';
  const background = isPearl ? 'rgba(250,249,251,0.94)' : glass.fillStrong;
  const foreground = isPearl ? '#1E1D24' : '#FFFFFF';

  const content = (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: background,
        borderColor: isPearl ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)',
        borderRadius: STREAMX_RADII.pill,
        borderWidth: 1,
        flexDirection: 'row',
        height: 48,
        justifyContent: 'center',
        paddingHorizontal: 22,
      }}>
      <MaterialCommunityIcons name={icon} size={20} color={foreground} style={{marginRight: 8}} />
      <AppText style={{color: foreground, fontSize: 15, fontWeight: '700'}}>
        {label}
      </AppText>
    </View>
  );

  if (isTV) {
    return (
      <TVFocusable
        accessibilityRole="button"
        accessibilityLabel={label}
        hasTVPreferredFocus={preferredFocus}
        onPress={onPress}
        borderRadius={26}
        focusScale={1.06}
        focusBorderColor={focusBorderColor}
        style={{borderRadius: 26, overflow: 'hidden'}}>
        {content}
      </TVFocusable>
    );
  }

  return (
    <LiquidPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      radius={STREAMX_RADII.pill}
      style={glassShadow('light', 0.45)}>
      {content}
    </LiquidPressable>
  );
};

const Hero = memo(
  ({isDrawerOpen, isVisible = true, onOpenDrawer}: HeroProps) => {
    const colors = useM3Colors();
    const {glass} = useStreamXTheme();
    const insets = useSafeAreaInsets();
    const [logoFailed, setLogoFailed] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<IMDbSuggestion[]>([]);
    const searchFieldRef = useRef<SearchFieldRef>(null);

    const provider = useContentStore(state => state.provider);
    const heroes = useHeroStore(state => state.heroes);
    const toggleLibrary = useWatchListStore(state => state.setItemCollections);
    const removeItem = useWatchListStore(state => state.removeItem);
    const isFocused = useIsFocused();
    const appActive = useAppActive();
    const {
      post: hero,
      activeIndex,
      readyLinks,
      step,
    } = useHeroRotation(
      heroes,
      provider.value,
      searchActive || isDrawerOpen || !isVisible || !isFocused || !appActive,
    );
    const navigation =
      useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const {width: viewportWidth} = useWindowDimensions();

    // Horizontal swipe changes the hero. The artwork follows the finger a
    // little, then springs back while the next hero fades in.
    const dragX = useSharedValue(0);
    const canSwipe = !isTV && readyLinks.length > 1;
    const swipeGesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(canSwipe)
          .activeOffsetX([-15, 15])
          .failOffsetY([-12, 12])
          .onUpdate(event => {
            dragX.set(event.translationX * 0.35);
          })
          .onEnd(event => {
            const passed =
              Math.abs(event.translationX) > 60 ||
              Math.abs(event.velocityX) > 600;
            if (passed) {
              runOnJS(step)(event.translationX < 0 ? 1 : -1);
            }
            dragX.set(withSpring(0, LIQUID_SPRINGS.settle));
          })
          .onFinalize(() => {
            if (dragX.get() !== 0) {
              dragX.set(withSpring(0, LIQUID_SPRINGS.settle));
            }
          }),
      [canSwipe, dragX, step],
    );
    const dragStyle = useAnimatedStyle(() => ({
      opacity: 1 - Math.min(Math.abs(dragX.get()) / 340, 0.3),
      transform: [{translateX: dragX.get() * 0.6}],
    }));
    const {data: heroData, error} = useHeroMetadata(
      hero?.link || '',
      provider.value,
    );

    const extras = heroData as
      | (typeof heroData & {
          releaseInfo?: string | number;
          imdbRating?: string | number;
          genres?: string[];
        })
      | undefined;

    const imageSource = useMemo(
      () => ({
        uri:
          heroData?.background ||
          heroData?.image ||
          heroData?.poster ||
          hero?.image ||
          '',
      }),
      [hero?.image, heroData],
    );
    const imageUri = imageSource.uri;
    const title = heroData?.title || hero?.title;
    const synopsis = heroData?.synopsis || '';
    const genres = useMemo(
      () =>
        normalizeContentTags(extras?.genres || heroData?.tags || []).slice(0, 3),
      [extras?.genres, heroData?.tags],
    );
    const rating = extras?.imdbRating
      ? String(extras.imdbRating)
      : (heroData?.rating || '').replace(/\s*\/\s*10$/i, '');
    const year = extras?.releaseInfo ? String(extras.releaseInfo) : undefined;

    useEffect(() => {
      setLogoFailed(false);
    }, [heroData?.logo]);

    useEffect(() => {
      if (!searchActive) {
        return;
      }
      const frame = requestAnimationFrame(() =>
        searchFieldRef.current?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    }, [searchActive]);

    const suppressSuggestionsRef = useRef(false);

    const handleTextChange = useCallback((text: string) => {
      suppressSuggestionsRef.current = false;
      setSearchText(text);
    }, []);

    const submitProviderSearch = useCallback(
      (value: string) => {
        Keyboard.dismiss();
        const query = value.trim();
        if (!query) {
          return;
        }
        setSearchActive(false);
        setSearchText('');
        setSuggestions([]);
        if (/^https?:\/\//i.test(query)) {
          navigation.navigate('Info', {
            link: query,
            provider: provider.value,
          });
          return;
        }
        navigation.navigate('ScrollList', {
          providerValue: provider.value,
          filter: query,
          title: provider.display_name,
          isSearch: true,
        });
      },
      [navigation, provider.display_name, provider.value],
    );

    const handleSelectSuggestion = useCallback(
      (value: string) => {
        const cleanTitle = sanitizeSearchQuery(value);
        Keyboard.dismiss();
        suppressSuggestionsRef.current = true;
        setSuggestions([]);
        setSearchText(cleanTitle);
        submitProviderSearch(cleanTitle);
      },
      [submitProviderSearch],
    );

    const handleFillSuggestion = useCallback((value: string) => {
      setSearchText(sanitizeSearchQuery(value));
    }, []);

    // Debounced IMDb search suggestions for home page search. The timer lives in
    // the effect so the component stays compatible with React Compiler.
    useEffect(() => {
      if (!searchActive || searchText.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      let cancelled = false;
      const timer = setTimeout(async () => {
        if (suppressSuggestionsRef.current) {
          setSuggestions([]);
          return;
        }
        const results = await fetchIMDbSuggestions(searchText.trim());
        if (!cancelled) {
          setSuggestions(results);
        }
      }, 250);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [searchText, searchActive]);

    const openDetails = useCallback(() => {
      if (!hero?.link) {
        return;
      }
      navigation.navigate('Info', {
        link: hero.link,
        provider: provider.value,
        poster: heroData?.poster || heroData?.image || heroData?.background,
      });
    }, [hero, heroData, navigation, provider.value]);

    const heroInLibrary = useWatchListStore(state =>
      Boolean(hero?.link) &&
      state.watchList.some(item => item.link === hero?.link),
    );
    const toggleMyList = useCallback(() => {
      if (!hero?.link) return;
      if (heroInLibrary) {
        removeItem(hero.link);
        return;
      }
      toggleLibrary(
        {
          title,
          poster: heroData?.poster || heroData?.image || hero?.image,
          link: hero.link,
          provider: provider.value,
        },
        [],
      );
    }, [
      hero,
      heroData,
      heroInLibrary,
      provider.value,
      removeItem,
      title,
      toggleLibrary,
    ]);

    return (
      <GestureDetector gesture={swipeGesture}>
        <View style={{backgroundColor: colors.background, paddingTop: insets.top + 4}}>
          {/* Header: StreamX wordmark opens the navigation drawer. */}
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingBottom: 10,
            }}>
            <LiquidPressable
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
              onPress={onOpenDrawer}
              disabled={isDrawerOpen}
              radius={16}
              haptic={false}>
              <View style={{paddingVertical: 4, paddingRight: 10}}>
                <StreamXLogo variant="lockup" size={24} />
              </View>
            </LiquidPressable>
            <View style={{flexDirection: 'row', gap: 10}}>
              <HeaderButton
                icon="magnify"
                label={`Search in ${provider.display_name}`}
                onPress={() => setSearchActive(true)}
                preferredFocus={isTV && !isDrawerOpen}
              />
            </View>
          </View>

          {/* Greeting row */}
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: glass.border,
                borderRadius: 14,
                borderWidth: 1,
                height: 42,
                justifyContent: 'center',
                marginRight: 12,
                overflow: 'hidden',
                width: 42,
              }}>
              <Image
                source={require('../../assets/brand/streamx-mark.png')}
                resizeMode="cover"
                style={{height: 42, width: 42}}
              />
            </View>
            <View style={{flex: 1, minWidth: 0}}>
              <AppText
                role="titleMediumEmphasized"
                numberOfLines={1}
                style={{color: colors.onSurface, fontSize: 16}}>
                {greeting()}
              </AppText>
              <AppText
                role="bodySmall"
                numberOfLines={1}
                style={{color: colors.onSurfaceVariant, marginTop: 1}}>
                {provider.display_name
                  ? `Streaming from ${provider.display_name}`
                  : 'Ready to watch something?'}
              </AppText>
            </View>
          </View>

          {/* Cinematic hero card */}
          <View style={{paddingHorizontal: 16}}>
            <View
              style={{
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: STREAMX_RADII.xl,
                height: HERO_CARD_HEIGHT,
                overflow: 'hidden',
                ...glassShadow('light', 0.9),
              }}>
              <Animated.View style={[{position: 'absolute', inset: 0}, dragStyle]}>
                {!imageUri ? (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: colors.surfaceContainerHighest,
                    }}
                  />
                ) : (
                  <Animated.Image
                    key={imageUri}
                    entering={FadeIn.duration(450)}
                    source={imageSource}
                    resizeMode="cover"
                    resizeMethod="resize"
                    {...{resizeMultiplier: isTV ? 1 : 0.5}}
                    style={{height: '100%', width: '100%'}}
                  />
                )}
              </Animated.View>

              <LinearGradient
                colors={[
                  'rgba(21,21,27,0.12)',
                  'rgba(21,21,27,0.18)',
                  'rgba(21,21,27,0.72)',
                  'rgba(16,16,21,0.94)',
                ]}
                locations={[0, 0.42, 0.78, 1]}
                style={{position: 'absolute', inset: 0}}
              />

              {/* Glass provider chip */}
              <View
                style={{
                  left: 16,
                  position: 'absolute',
                  top: 16,
                }}>
                <GlassSurface
                  variant="chip"
                  radius={STREAMX_RADII.pill}
                  elevated={false}
                  contentStyle={{paddingHorizontal: 12, paddingVertical: 6}}>
                  <View style={{alignItems: 'center', flexDirection: 'row'}}>
                    <View
                      style={{
                        backgroundColor: '#D9C9AD',
                        borderRadius: 4,
                        height: 6,
                        marginRight: 6,
                        width: 6,
                      }}
                    />
                    <AppText
                      style={{
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.8,
                      }}>
                      {(provider.display_name || 'StreamX').toUpperCase()}
                    </AppText>
                  </View>
                </GlassSurface>
              </View>

              <Animated.View
                entering={FadeInDown.delay(80)
                  .springify()
                  .damping(20)
                  .stiffness(180)}
                style={{
                  bottom: HERO_CONTENT_BOTTOM,
                  left: 20,
                  position: 'absolute',
                  right: 20,
                }}>
                <Animated.View
                  key={hero?.link || 'empty'}
                  entering={FadeIn.duration(350)}>
                  {heroData?.logo && !logoFailed ? (
                    <Image
                      source={{uri: heroData.logo}}
                      onError={() => setLogoFailed(true)}
                      resizeMode="contain"
                      resizeMethod="resize"
                      style={{height: 54, marginBottom: 4, width: 200}}
                    />
                  ) : (
                    <AppText
                      numberOfLines={2}
                      style={{
                        color: '#FFFFFF',
                        fontSize: 30,
                        fontWeight: '800',
                        letterSpacing: -0.6,
                        lineHeight: 34,
                        marginBottom: 4,
                        maxWidth: Math.min(320, viewportWidth - 80),
                      }}>
                      {title || 'StreamX'}
                    </AppText>
                  )}

                  {rating || year || genres.length > 0 ? (
                    <View
                      style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 7,
                        marginTop: 6,
                      }}>
                      {rating ? (
                        <View style={{alignItems: 'center', flexDirection: 'row'}}>
                          <MaterialCommunityIcons
                            name="star"
                            size={14}
                            color="#D9C9AD"
                          />
                          <AppText
                            style={{
                              color: '#F3EFE6',
                              fontSize: 12,
                              fontWeight: '700',
                              marginLeft: 3,
                            }}>
                            {rating}/10
                          </AppText>
                        </View>
                      ) : null}
                      {year ? (
                        <AppText style={{color: 'rgba(255,255,255,0.75)', fontSize: 12}}>
                          {year}
                        </AppText>
                      ) : null}
                      {genres.length > 0 ? (
                        <AppText
                          numberOfLines={1}
                          style={{color: 'rgba(255,255,255,0.75)', fontSize: 12}}>
                          {genres.join(' • ')}
                        </AppText>
                      ) : null}
                    </View>
                  ) : null}

                  {synopsis ? (
                    <AppText
                      numberOfLines={2}
                      style={{
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 12,
                        lineHeight: 17,
                        marginTop: 6,
                        maxWidth: Math.min(330, viewportWidth - 80),
                      }}>
                      {synopsis}
                    </AppText>
                  ) : null}
                </Animated.View>

                <View
                  style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 10,
                    marginTop: 14,
                  }}>
                  <HeroAction
                    label="Watch Now"
                    icon="play"
                    tone="pearl"
                    onPress={openDetails}
                    preferredFocus={isTV && !isDrawerOpen}
                  />
                  <HeroAction
                    label={heroInLibrary ? 'Saved' : 'My List'}
                    icon={heroInLibrary ? 'check' : 'plus'}
                    tone="glass"
                    onPress={toggleMyList}
                  />
                </View>
              </Animated.View>

              {/* Pagination indicators */}
              {readyLinks.length > 1 ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    bottom: 8,
                    flexDirection: 'row',
                    gap: 5,
                    position: 'absolute',
                    right: 20,
                  }}>
                  {heroes.map((post, index) =>
                    readyLinks.includes(post.link) ? (
                      <View
                        key={post.link}
                        style={{
                          backgroundColor:
                            index === activeIndex
                              ? '#FFFFFF'
                              : 'rgba(255,255,255,0.35)',
                          borderRadius: 3,
                          height: 5,
                          width: index === activeIndex ? 16 : 5,
                        }}
                      />
                    ) : null,
                  )}
                </View>
              ) : null}
            </View>
          </View>

          {error && !heroData ? (
            <AppText
              role="bodySmall"
              style={{
                color: colors.onSurfaceVariant,
                marginTop: 8,
                paddingHorizontal: 20,
              }}>
              Some featured details are unavailable
            </AppText>
          ) : null}

          {/* Full-screen search overlay with suggestions */}
          <Modal
            visible={searchActive}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {
              setSearchActive(false);
              setSearchText('');
              setSuggestions([]);
            }}>
            <SafeAreaView
              style={{flex: 1, backgroundColor: colors.background}}
              edges={['top', 'left', 'right']}>
              <View
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  paddingBottom: 10,
                  paddingHorizontal: 16,
                  paddingTop: 8,
                }}>
                <TVFocusable
                  accessibilityLabel="Close search"
                  accessibilityRole="button"
                  hasTVPreferredFocus={isTV}
                  borderRadius={22}
                  focusScale={1.1}
                  onPress={() => {
                    setSearchActive(false);
                    setSearchText('');
                    setSuggestions([]);
                  }}
                  style={{height: 44, width: 44, alignItems: 'center', justifyContent: 'center'}}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={26}
                    color={colors.onSurface}
                  />
                </TVFocusable>

                <View style={{flex: 1}}>
                  <SearchField
                    ref={searchFieldRef}
                    value={searchText}
                    onChangeText={handleTextChange}
                    onSubmit={submitProviderSearch}
                    onClear={() => {
                      suppressSuggestionsRef.current = false;
                      setSearchText('');
                      setSuggestions([]);
                    }}
                    placeholder={`Search in ${provider.display_name}...`}
                  />
                </View>

                {searchText.length > 0 && (
                  <Pressable
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                    onPress={() => {
                      suppressSuggestionsRef.current = false;
                      setSearchText('');
                      setSuggestions([]);
                    }}
                    style={({pressed}) => ({
                      alignItems: 'center',
                      height: 44,
                      justifyContent: 'center',
                      opacity: pressed ? 0.62 : 1,
                      width: 32,
                    })}>
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={colors.onSurfaceVariant}
                    />
                  </Pressable>
                )}
              </View>

              <View style={{flex: 1}}>
                <SearchSuggestions
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                  onFillSuggestion={handleFillSuggestion}
                />
              </View>
            </SafeAreaView>
          </Modal>
        </View>
      </GestureDetector>
    );
  },
);

Hero.displayName = 'Hero';

export default Hero;
