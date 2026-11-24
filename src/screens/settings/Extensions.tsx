import {useFocusEffect} from '@react-navigation/native';
import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import useContentStore from '../../lib/zustand/contentStore';
import {
  extensionStorage,
  type ProviderExtension,
  type ProviderSource,
} from '../../lib/storage/extensionStorage';
import {extensionManager} from '../../lib/services/ExtensionManager';
import {
  updateProvidersService,
  type UpdateInfo,
} from '../../lib/services/UpdateProviders';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {settingsStorage} from '../../lib/storage';
import ProviderSourceManager from './components/ProviderSourceManager';
import ProviderCard, {type ProviderTestStatus} from './components/ProviderCard';
import {
  ProviderDiagnosticError,
  testProvider,
} from '../../lib/services/providerDiagnostics';
import AppDialog, {
  type AppDialogAction,
  type AppDialogVariant,
} from '../../components/AppDialog';
import ProviderTestProgressDialog, {
  type ProviderTestStepState,
} from '../../components/ProviderTestProgressDialog';
import ProviderSettingsModal from './components/ProviderSettingsModal';
import type {ProviderDiagnosticProgress} from '../../lib/services/providerDiagnostics';
import AppText from '../../components/ui/Text';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {TVFocusGuide} from '../../components/tv';
import {isTV} from '../../lib/tv';
import {
  bulkProviderInstaller,
  type BulkJobStatus,
  type BulkProgress,
  type BulkResult,
} from '../../lib/services/bulkProviderInstaller';
import {ensureDefaultProviderSource} from '../../lib/services/defaultProviderSource';
import {STREAMX_BRAND, glassShadow} from '../../theme/streamx';
import {useStreamXTheme} from '../../theme/useStreamXTheme';
import GlassSurface from '../../components/glass/GlassSurface';
import GlassButton from '../../components/glass/GlassButton';
import LiquidPressable from '../../components/glass/LiquidPressable';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Extensions'>;

interface DialogState {
  title: string;
  message: string;
  variant: AppDialogVariant;
  actions?: AppDialogAction[];
}

interface ProviderTestState {
  providerName: string;
  steps: ProviderTestStepState;
  resultMessage?: string;
}

type FilterId = 'all' | 'installed' | 'available' | 'updates' | 'failed';

const FILTERS: Array<{id: FilterId; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'installed', label: 'Installed'},
  {id: 'available', label: 'Not installed'},
  {id: 'updates', label: 'Updates'},
  {id: 'failed', label: 'Failed'},
];

const createProviderTestSteps = (): ProviderTestStepState => ({
  catalog: 'pending',
  posts: 'pending',
  metadata: 'pending',
  playback: 'pending',
  streams: 'pending',
});

const isSameProvider = (
  left: ProviderExtension | undefined,
  right: ProviderExtension,
) =>
  left?.value === right.value && left.source?.author === right.source?.author;

const providerListKey = (item: ProviderExtension) =>
  (item.source?.author || '') + ':' + item.value;

const Extensions = ({navigation, route}: Props) => {
  const colors = useM3Colors();
  const {mode, glass} = useStreamXTheme();
  const primary = colors.primary;
  const activeExtensionProvider = useContentStore(state => state.provider);
  const setActiveExtensionProvider = useContentStore(state => state.setProvider);
  const installedProviders = useContentStore(state => state.installedProviders);
  const availableProviders = useContentStore(state => state.availableProviders);
  const setInstalledProviders = useContentStore(state => state.setInstalledProviders);
  const setAvailableProviders = useContentStore(state => state.setAvailableProviders);

  const [installingProvider, setInstallingProvider] = useState<string | null>(null);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [updateInfos, setUpdateInfos] = useState<UpdateInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [providerTest, setProviderTest] = useState<ProviderTestState | null>(null);
  const testAbortControllerRef = useRef<AbortController | null>(null);
  const activeTestProviderKeyRef = useRef<string | null>(null);
  const [settingsProvider, setSettingsProvider] = useState<ProviderExtension | null>(null);
  const [providerTestStatuses, setProviderTestStatuses] = useState<
    Record<string, ProviderTestStatus>
  >({});
  const [activeSourceAuthor, setActiveSourceAuthor] = useState<string>(
    extensionStorage.getProviderSource()?.author || '',
  );
  const [bulk, setBulk] = useState<BulkProgress | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');

  const showDialog = (
    title: string,
    message: string,
    variant: AppDialogVariant = 'info',
    actions?: AppDialogAction[],
  ) => setDialog({title, message, variant, actions});

  useFocusEffect(
    useCallback(() => {
      const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Settings');
        return true;
      });
      return () => backSub.remove();
    }, [navigation]),
  );

  const loadProviders = useCallback((author?: string) => {
    const selectedAuthor =
      author || extensionStorage.getProviderSource()?.author || '';
    const installed = extensionStorage.getInstalledProviders() || [];
    const available = selectedAuthor
      ? extensionStorage.getAvailableProviders(selectedAuthor)
      : [];
    setInstalledProviders(installed);
    setAvailableProviders(available.filter(item => item && !item.disabled));
    setActiveSourceAuthor(selectedAuthor);
  }, [setAvailableProviders, setInstalledProviders]);

  const checkForUpdates = useCallback(async (force = true) => {
    const source = extensionStorage.getProviderSource();
    if (!source) {
      setUpdateInfos([]);
      return;
    }
    try {
      const updates = await updateProvidersService.checkForUpdatesManual(force);
      setUpdateInfos(updates);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }, []);

  useEffect(() => {
    // A fresh install ships with Zenda Cross preconfigured.
    ensureDefaultProviderSource();
    const initialSource = extensionStorage.getProviderSource();
    const initialAuthor = initialSource?.author || '';
    setActiveSourceAuthor(initialAuthor);
    loadProviders(initialAuthor);

    const initializeExtensions = async () => {
      try {
        await extensionManager.initialize();
        const currentSource = extensionStorage.getProviderSource();
        const author = currentSource?.author || '';
        if (author !== initialAuthor) {
          setActiveSourceAuthor(author);
          loadProviders(author);
        }
        await checkForUpdates(false);

        const cachedAvailable = author
          ? extensionStorage.getAvailableProviders(author)
          : [];
        // First launch: fetch the Zenda Cross manifest so the dashboard shows
        // real providers instead of an empty list.
        if (author && cachedAvailable.length === 0) {
          await refreshProviders(author);
        }
      } catch (error) {
        console.warn('Background extensions initialization error:', error);
      }
    };

    initializeExtensions();
  }, []);

  useEffect(() => {
    return () => {
      testAbortControllerRef.current?.abort();
    };
  }, []);

  const haptic = () => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  };

  const handleUpdateProvider = async (provider: ProviderExtension) => {
    haptic();
    const providerKey = providerListKey(provider);
    setUpdatingProvider(providerKey);
    try {
      const success = await updateProvidersService.updateProvider(provider, {
        throwOnError: true,
      });
      if (success) {
        loadProviders();
        await checkForUpdates();
        if (isSameProvider(activeExtensionProvider, provider)) {
          setActiveExtensionProvider(provider);
        }
      } else {
        showDialog('Error', 'Failed to update provider. Please try again.', 'error');
      }
    } catch (error) {
      showDialog(
        'Error',
        error instanceof Error ? error.message : 'Failed to update provider.',
        'error',
      );
    } finally {
      setUpdatingProvider(null);
    }
  };

  const handleInstallProvider = async (provider: ProviderExtension) => {
    haptic();
    const providerKey = providerListKey(provider);
    setInstallingProvider(providerKey);
    try {
      await extensionManager.installProvider(provider);
      loadProviders();
      const refreshed = extensionStorage.getInstalledProviders() || [];
      setInstalledProviders(refreshed);

      const currentProvider = useContentStore.getState().provider;
      const currentInstalled = refreshed.some(item =>
        isSameProvider(item, currentProvider),
      );
      if (!currentProvider?.value || !currentInstalled) {
        setActiveExtensionProvider(provider);
      }
    } catch (error) {
      showDialog(
        'Error',
        error instanceof Error ? error.message : 'Failed to install provider.',
        'error',
      );
    } finally {
      setInstallingProvider(null);
    }
  };

  const handleUninstallProvider = (provider: ProviderExtension) => {
    showDialog(
      'Uninstall Provider',
      `Are you sure you want to uninstall ${
        provider.display_name || 'this provider'
      }?`,
      'warning',
      [
        {label: 'Cancel'},
        {
          label: 'Uninstall',
          variant: 'destructive',
          testID: `confirm-uninstall-${provider.value}`,
          onPress: () => {
            extensionStorage.uninstallProvider(
              provider.value,
              provider.source?.author,
            );
            loadProviders();
            const refreshed = extensionStorage.getInstalledProviders() || [];
            setInstalledProviders(refreshed);
            if (isSameProvider(activeExtensionProvider, provider)) {
              setActiveExtensionProvider(
                refreshed[0] || {
                  value: '',
                  display_name: '',
                  source: {author: '', url: ''},
                  type: '',
                  version: '',
                  icon: '',
                  disabled: false,
                  installed: false,
                },
              );
            }
          },
        },
      ],
    );
  };

  const handleSetActiveProvider = (provider: ProviderExtension) => {
    haptic();
    setActiveExtensionProvider(provider);
  };

  const handleCloseProviderTest = useCallback(() => {
    testAbortControllerRef.current?.abort();
    testAbortControllerRef.current = null;
    if (activeTestProviderKeyRef.current) {
      const key = activeTestProviderKeyRef.current;
      setProviderTestStatuses(current => {
        if (current[key] === 'testing') {
          const next = {...current};
          delete next[key];
          return next;
        }
        return current;
      });
      activeTestProviderKeyRef.current = null;
    }
    setProviderTest(null);
  }, []);

  const handleTestProvider = async (provider: ProviderExtension) => {
    testAbortControllerRef.current?.abort();
    const controller = new AbortController();
    testAbortControllerRef.current = controller;

    const providerKey = providerListKey(provider);
    activeTestProviderKeyRef.current = providerKey;
    setProviderTestStatuses(current => ({...current, [providerKey]: 'testing'}));
    setProviderTest({
      providerName: provider.display_name,
      steps: createProviderTestSteps(),
    });
    const handleProgress = (progress: ProviderDiagnosticProgress) => {
      if (controller.signal.aborted) return;
      setProviderTest(current =>
        current
          ? {
              ...current,
              steps: {...current.steps, [progress.stage]: progress.status},
              resultMessage:
                progress.status === 'failed'
                  ? progress.detail
                  : current.resultMessage,
            }
          : current,
      );
    };
    try {
      const result = await testProvider(provider.value, handleProgress, controller.signal);
      if (controller.signal.aborted) return;
      const playableTitle =
        result.episode?.title || result.directLink?.title || 'Direct stream';
      setProviderTest(current =>
        current
          ? {
              ...current,
              resultMessage: [
                `Provider: ${provider.display_name}`,
                `Catalog: ${result.catalog.title}`,
                `List: ${result.post.title}`,
                `Metadata: ${result.metadata.title}`,
                `Playback: ${playableTitle}`,
                `Streams: ${result.streams.length}`,
              ].join('\n'),
            }
          : current,
      );
      setProviderTestStatuses(current => ({...current, [providerKey]: 'working'}));
    } catch (error) {
      if (controller.signal.aborted) return;
      const stage =
        error instanceof ProviderDiagnosticError ? error.stage : 'unknown';
      const message = error instanceof Error ? error.message : String(error);
      setProviderTest(current =>
        current ? {...current, resultMessage: `Stage: ${stage}\n${message}`} : current,
      );
      setProviderTestStatuses(current => ({...current, [providerKey]: 'failed'}));
    } finally {
      if (testAbortControllerRef.current === controller) {
        testAbortControllerRef.current = null;
        activeTestProviderKeyRef.current = null;
      }
    }
  };

  const refreshProviders = async (sourceAuthor: string) => {
    setRefreshing(true);
    try {
      if (!sourceAuthor) {
        setAvailableProviders([]);
        return;
      }
      const source = extensionStorage
        .getProviderSources()
        .find(item => item.author === sourceAuthor);
      if (!source) {
        setAvailableProviders([]);
        return;
      }
      const providers = await extensionManager.fetchManifest(source, true);
      setAvailableProviders(providers);
      loadProviders(sourceAuthor);
      await checkForUpdates();
    } catch (error) {
      showDialog(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to refresh providers list. Please check your internet connection.',
        'error',
      );
    } finally {
      setTimeout(() => setRefreshing(false), 50);
    }
  };

  const handleRefresh = async () => {
    await refreshProviders(activeSourceAuthor);
  };

  const installAllProviders = async () => {
    haptic();
    setBulkResult(null);
    try {
      const result = await bulkProviderInstaller.installAll({
        source: extensionStorage.getProviderSource(),
        onProgress: setBulk,
      });
      setBulkResult(result);
      loadProviders();
      await checkForUpdates();
      if (result.installed > 0) {
        const refreshed = extensionStorage.getInstalledProviders() || [];
        if (!useContentStore.getState().provider?.value) {
          const first = refreshed[0];
          if (first) setActiveExtensionProvider(first);
        }
      }
    } catch (error) {
      setBulk(null);
      showDialog(
        'Install All Providers',
        error instanceof Error ? error.message : 'Could not start the installation.',
        'error',
      );
    }
  };

  const cancelBulkInstall = () => {
    bulkProviderInstaller.cancel();
  };

  const currentData = useMemo(() => {
    const allProviders = [...(availableProviders || []), ...(installedProviders || [])].filter(
      item => item && item.value,
    );
    const providersMap = new Map<string, ProviderExtension>();
    for (const item of allProviders) {
      const key = providerListKey(item);
      const existing = providersMap.get(key);
      providersMap.set(key, {
        ...(existing || {}),
        ...item,
        hasSettings: Boolean(item.hasSettings || existing?.hasSettings),
      });
    }
    return Array.from(providersMap.values());
  }, [availableProviders, installedProviders]);

  const installedKeys = useMemo(
    () => new Set(installedProviders.map(providerListKey)),
    [installedProviders],
  );
  const updatesByKey = useMemo(
    () => new Map(updateInfos.map(info => [providerListKey(info.provider), info])),
    [updateInfos],
  );
  const bulkByValue = useMemo(() => {
    const map = new Map<string, {status: BulkJobStatus; error?: string}>();
    bulk?.jobs.forEach(job => map.set(job.value, {status: job.status, error: job.error}));
    return map;
  }, [bulk]);

  const failedCount = bulk?.jobs.filter(job => job.status === 'failed').length ?? 0;
  const installedCount = currentData.filter(item => installedKeys.has(providerListKey(item))).length;
  const updatesCount = currentData.filter(item => updatesByKey.get(providerListKey(item))?.hasUpdate).length;

  const filterCount: Record<FilterId, number> = {
    all: currentData.length,
    installed: installedCount,
    available: currentData.length - installedCount,
    updates: updatesCount,
    failed: failedCount,
  };

  const visibleData = useMemo(() => {
    if (filter === 'installed') {
      return currentData.filter(item => installedKeys.has(providerListKey(item)));
    }
    if (filter === 'available') {
      return currentData.filter(item => !installedKeys.has(providerListKey(item)));
    }
    if (filter === 'updates') {
      return currentData.filter(item => updatesByKey.get(providerListKey(item))?.hasUpdate);
    }
    if (filter === 'failed') {
      return currentData.filter(item => {
        const job = bulkByValue.get(item.value);
        return job?.status === 'failed' || providerTestStatuses[providerListKey(item)] === 'failed';
      });
    }
    return currentData;
  }, [bulkByValue, currentData, filter, installedKeys, providerTestStatuses, updatesByKey]);

  const renderProviderCard = useCallback(
    ({item}: {item: ProviderExtension}) => {
      if (!item || !item.value) {
        return null;
      }
      const itemKey = providerListKey(item);
      const isActive = isSameProvider(activeExtensionProvider, item);
      const isInstalled = installedKeys.has(itemKey);
      const updateInfo = updatesByKey.get(itemKey);
      const hasUpdate = updateInfo?.hasUpdate || false;
      const bulkJob = bulkByValue.get(item.value);

      return (
        <ProviderCard
          provider={item}
          itemKey={itemKey}
          installed={isInstalled}
          active={isActive}
          installing={installingProvider === itemKey}
          updating={updatingProvider === itemKey}
          testStatus={providerTestStatuses[itemKey] || 'untested'}
          hasUpdate={hasUpdate}
          hasSettings={item.hasSettings}
          primary={primary}
          onActivate={() => handleSetActiveProvider(item)}
          onInstall={() => handleInstallProvider(item)}
          onUpdate={() => updateInfo && handleUpdateProvider(updateInfo.provider)}
          onTest={() => handleTestProvider(item)}
          onUninstall={() => handleUninstallProvider(item)}
          onOpenSettings={() => setSettingsProvider(item)}
          bulkStatus={bulkJob?.status}
          bulkError={bulkJob?.error}
        />
      );
    },
    [
      activeExtensionProvider,
      bulkByValue,
      installedKeys,
      installingProvider,
      providerTestStatuses,
      primary,
      updatingProvider,
      updatesByKey,
    ],
  );

  const bulkRunning = bulk?.running ?? false;
  const totalForBar = bulk?.total || 0;
  const completedForBar = bulk?.completed || 0;
  const progressRatio = totalForBar > 0 ? completedForBar / totalForBar : 0;

  return (
    <TVFocusGuide autoFocus={true} trapFocusRight={true} trapFocusDown={true} style={{flex: 1}}>
      <View style={{backgroundColor: colors.background, flex: 1, paddingTop: isTV ? 32 : 10}}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            paddingBottom: 12,
            paddingHorizontal: 16,
            paddingTop: 6,
          }}>
          <LiquidPressable
            accessibilityRole="button"
            accessibilityLabel="Back to settings"
            onPress={() => navigation.navigate('Settings')}
            radius={16}
            haptic={false}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: glass.fillStrong,
                borderColor: glass.border,
                borderRadius: 16,
                borderWidth: 1,
                height: 44,
                justifyContent: 'center',
                width: 44,
              }}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            </View>
          </LiquidPressable>
          <View style={{flex: 1, marginLeft: 12}}>
            <AppText
              role="headlineSmallEmphasized"
              style={{color: colors.onBackground, fontSize: 24, fontWeight: '700'}}>
              Providers
            </AppText>
            <AppText role="bodySmall" style={{color: colors.onSurfaceVariant}}>
              Install and test streaming sources
            </AppText>
          </View>
          <LiquidPressable
            accessibilityRole="button"
            accessibilityLabel="Refresh providers"
            onPress={handleRefresh}
            radius={16}
            haptic={false}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: glass.fillStrong,
                borderColor: glass.border,
                borderRadius: 16,
                borderWidth: 1,
                height: 44,
                justifyContent: 'center',
                width: 44,
              }}>
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons name="refresh" size={20} color={colors.onSurface} />
              )}
            </View>
          </LiquidPressable>
        </View>

        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: 48}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[primary]}
              tintColor={primary}
              progressBackgroundColor={colors.surfaceContainerHigh}
            />
          }>
          <View style={{paddingHorizontal: 16, paddingTop: 4}}>
            <ProviderSourceManager
              visible
              primary={primary}
              pendingSource={route.params?.addSource}
              pendingSourceRequestId={route.params?.requestId}
              onSourceChanged={async (source: ProviderSource | undefined) => {
                const author = source?.author || '';
                setActiveSourceAuthor(author);
                loadProviders(author);
                await refreshProviders(author);
              }}
            />
          </View>

          {/* Zenda Cross */}
          <View style={{paddingHorizontal: 16, paddingTop: 16}}>
            <GlassSurface
              variant="panel"
              radius={26}
              tinted
              style={[glassShadow(mode, 1.1)]}
              contentStyle={{padding: 16}}>
              <View style={{alignItems: 'center', flexDirection: 'row'}}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(36,35,42,0.92)',
                    borderColor: 'rgba(255,255,255,0.35)',
                    borderRadius: 18,
                    borderWidth: 1,
                    height: 58,
                    justifyContent: 'center',
                    width: 58,
                  }}>
                  <AppText
                    style={{
                      color: '#F3EFE6',
                      fontSize: 30,
                      fontWeight: '800',
                      letterSpacing: -2,
                    }}>
                    Z
                  </AppText>
                </View>
                <View style={{flex: 1, marginLeft: 14, minWidth: 0}}>
                  <View style={{alignItems: 'center', flexDirection: 'row'}}>
                    <MaterialCommunityIcons name="crown" size={14} color={colors.tertiary} />
                    <AppText
                      numberOfLines={1}
                      style={{
                        color: colors.onSurface,
                        fontSize: 17,
                        fontWeight: '800',
                        letterSpacing: 0.6,
                        marginLeft: 5,
                      }}>
                      {STREAMX_BRAND.provider.title}
                    </AppText>
                  </View>
                  <AppText
                    numberOfLines={1}
                    style={{color: colors.onSurfaceVariant, fontSize: 12, marginTop: 3}}>
                    {STREAMX_BRAND.provider.subtitle}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={{color: colors.onSurfaceVariant, fontSize: 10.5, marginTop: 3, opacity: 0.8}}>
                    {availableProviders.length} providers • {STREAMX_BRAND.provider.author}
                  </AppText>
                </View>
              </View>

              <View style={{marginTop: 14}}>
                {bulkRunning ? (
                  <View>
                    <View
                      style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        height: 8,
                        overflow: 'hidden',
                      }}>
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 999,
                          height: 8,
                          width: `${Math.round(progressRatio * 100)}%`,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                      }}>
                      <AppText style={{color: colors.onSurface, fontSize: 12, fontWeight: '600'}}>
                        Installing {completedForBar} of {totalForBar}
                        {bulk?.jobs.find(job => job.status === 'installing')
                          ? ` • ${bulk.jobs.find(job => job.status === 'installing')?.display_name}`
                          : ''}
                      </AppText>
                      <LiquidPressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel provider installation"
                        onPress={cancelBulkInstall}
                        radius={14}>
                        <View
                          style={{
                            backgroundColor: colors.errorContainer,
                            borderRadius: 14,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                          }}>
                          <AppText
                            style={{
                              color: colors.onErrorContainer,
                              fontSize: 11,
                              fontWeight: '700',
                            }}>
                            Cancel
                          </AppText>
                        </View>
                      </LiquidPressable>
                    </View>
                  </View>
                ) : (
                  <GlassButton
                    label={
                      bulkResult
                        ? 'Install All Providers Again'
                        : 'Install All Providers'
                    }
                    icon="download"
                    tone="ink"
                    fullWidth
                    onPress={installAllProviders}
                    testID="install-all-providers"
                    accessibilityLabel="Install all Zenda Cross providers"
                  />
                )}

                {bulkResult && !bulkRunning ? (
                  <View
                    style={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 10,
                    }}>
                    <AppText style={{color: colors.onSurfaceVariant, fontSize: 11.5, flex: 1}}>
                      {bulkResult.installed} installed • {bulkResult.skipped} already up to date
                      {bulkResult.failed > 0 ? ` • ${bulkResult.failed} failed` : ''}
                    </AppText>
                    {bulkResult.failed > 0 ? (
                      <LiquidPressable
                        accessibilityRole="button"
                        accessibilityLabel="Retry failed provider installations"
                        onPress={installAllProviders}
                        radius={12}>
                        <AppText
                          style={{
                            color: colors.primary,
                            fontSize: 11.5,
                            fontWeight: '700',
                            marginLeft: 8,
                          }}>
                          Retry failed
                        </AppText>
                      </LiquidPressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </GlassSurface>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{marginTop: 18}}
            contentContainerStyle={{gap: 8, paddingHorizontal: 16}}>
            {FILTERS.map(item => {
              const selected = filter === item.id;
              return (
                <LiquidPressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{selected}}
                  accessibilityLabel={`Filter providers: ${item.label}`}
                  onPress={() => setFilter(item.id)}
                  radius={999}
                  haptic={false}>
                  <View
                    style={{
                      backgroundColor: selected ? colors.primary : glass.fillStrong,
                      borderColor: selected ? colors.primary : glass.border,
                      borderRadius: 999,
                      borderWidth: 1,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}>
                    <AppText
                      style={{
                        color: selected ? colors.onPrimary : colors.onSurface,
                        fontSize: 12.5,
                        fontWeight: selected ? '700' : '600',
                      }}>
                      {item.label}
                      {filterCount[item.id] > 0 ? ` (${filterCount[item.id]})` : ''}
                    </AppText>
                  </View>
                </LiquidPressable>
              );
            })}
          </ScrollView>

          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              paddingBottom: 10,
              paddingTop: 16,
            }}>
            <AppText
              role="titleMediumEmphasized"
              style={{color: colors.onBackground, fontSize: 17, fontWeight: '700'}}>
              {filter === 'all' ? 'All providers' : FILTERS.find(f => f.id === filter)?.label}
            </AppText>
            <AppText style={{color: colors.onSurfaceVariant, fontSize: 12}}>
              {visibleData.length}
            </AppText>
          </View>

          {visibleData.length === 0 ? (
            <View style={{alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40}}>
              <MaterialCommunityIcons
                name={refreshing ? 'cloud-sync-outline' : 'package-variant'}
                size={52}
                color={colors.onSurfaceVariant}
              />
              <AppText
                role="titleMediumEmphasized"
                style={{color: colors.onSurface, marginTop: 12, textAlign: 'center'}}>
                {refreshing ? 'Loading providers' : 'No providers here yet'}
              </AppText>
              <AppText
                role="bodyMedium"
                style={{
                  color: colors.onSurfaceVariant,
                  marginTop: 6,
                  textAlign: 'center',
                }}>
                {filter === 'all'
                  ? 'Pull to refresh the Zenda Cross manifest, or check your connection.'
                  : 'Try another filter or refresh the provider list.'}
              </AppText>
            </View>
          ) : (
            visibleData.map(item => (
              <View key={providerListKey(item)}>{renderProviderCard({item})}</View>
            ))
          )}
        </ScrollView>

        <AppDialog
          visible={dialog !== null}
          title={dialog?.title || ''}
          message={dialog?.message || ''}
          primary={primary}
          variant={dialog?.variant}
          actions={dialog?.actions}
          onDismiss={() => setDialog(null)}
        />
        <ProviderTestProgressDialog
          visible={providerTest !== null}
          providerName={providerTest?.providerName || ''}
          steps={providerTest?.steps || createProviderTestSteps()}
          resultMessage={providerTest?.resultMessage}
          primary={primary}
          onClose={handleCloseProviderTest}
        />
        <ProviderSettingsModal
          visible={settingsProvider !== null}
          provider={settingsProvider}
          onClose={() => setSettingsProvider(null)}
        />
      </View>
    </TVFocusGuide>
  );
};

export default Extensions;
