import {MaterialCommunityIcons} from '@expo/vector-icons';
import React from 'react';
import {ActivityIndicator, Image, Pressable, View} from 'react-native';
import type {ProviderExtension} from '../../../lib/storage/extensionStorage';
import {useM3Colors} from '../../../theme/M3PaletteContext';
import {ProviderStatusBadge, ProviderTestStatus} from './ProviderStatusBadge';
import {ProviderCardActions} from './ProviderCardActions';
import type {BulkJobStatus} from '../../../lib/services/bulkProviderInstaller';
import AppText from '../../../components/ui/Text';
import GlassSurface from '../../../components/glass/GlassSurface';
import {STREAMX_RADII, glassShadow} from '../../../theme/streamx';
import {useStreamXTheme} from '../../../theme/useStreamXTheme';

export type {ProviderTestStatus};

interface ProviderCardProps {
  provider: ProviderExtension;
  itemKey: string;
  installed: boolean;
  active: boolean;
  installing: boolean;
  updating: boolean;
  testStatus: ProviderTestStatus;
  hasUpdate: boolean;
  hasSettings?: boolean;
  primary: string;
  onActivate: () => void;
  onInstall: () => void;
  onUpdate: () => void;
  onTest: () => void;
  onUninstall: () => void;
  onOpenSettings?: () => void;
  bulkStatus?: BulkJobStatus;
  bulkError?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  'Zenda-Cross': 'Zenda Cross',
};

const StatusChip = ({
  label,
  bg,
  fg,
  icon,
}: {
  label: string;
  bg: string;
  fg: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) => (
  <View
    style={{
      alignItems: 'center',
      backgroundColor: bg,
      borderRadius: STREAMX_RADII.pill,
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 5,
    }}>
    {icon ? (
      <MaterialCommunityIcons name={icon} size={13} color={fg} style={{marginRight: 4}} />
    ) : null}
    <AppText style={{color: fg, fontSize: 11, fontWeight: '700'}}>{label}</AppText>
  </View>
);

const ProviderCard = ({
  provider,
  itemKey,
  installed,
  active,
  installing,
  updating,
  testStatus,
  hasUpdate,
  hasSettings,
  primary,
  onActivate,
  onInstall,
  onUpdate,
  onTest,
  onUninstall,
  onOpenSettings,
  bulkStatus,
  bulkError,
}: ProviderCardProps) => {
  const colors = useM3Colors();
  const {mode, glass} = useStreamXTheme();
  const sourceLabel =
    SOURCE_LABELS[provider.source?.author || ''] ||
    provider.source?.author ||
    'StreamX';
  const bulkInstalling = bulkStatus === 'installing' || bulkStatus === 'queued';
  const busy = installing || bulkInstalling;

  return (
    <GlassSurface
      variant="card"
      radius={22}
      tinted={active}
      style={[glassShadow(mode, 0.8), {marginBottom: 12, marginHorizontal: 16}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${provider.display_name}${active ? ', active' : ''}`}
        onPress={installed ? onActivate : undefined}
        android_ripple={{color: 'rgba(255,255,255,0.12)'}}
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 10,
        }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.42)',
            borderColor: active ? colors.primary : glass.border,
            borderRadius: 16,
            borderWidth: active ? 2 : 1,
            height: 52,
            justifyContent: 'center',
            overflow: 'hidden',
            width: 52,
          }}>
          {provider.icon ? (
            <Image
              source={{uri: provider.icon}}
              style={{height: '100%', width: '100%'}}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            <AppText
              style={{color: colors.onSurface, fontSize: 20, fontWeight: '800'}}>
              {(provider.display_name || '?').slice(0, 1).toUpperCase()}
            </AppText>
          )}
        </View>

        <View style={{flex: 1, marginLeft: 12, minWidth: 0}}>
          <AppText
            numberOfLines={1}
            style={{color: colors.onSurface, fontSize: 16, fontWeight: '700'}}>
            {provider.display_name || 'Unknown Provider'}
          </AppText>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              marginTop: 3,
            }}>
            <AppText
              numberOfLines={1}
              style={{color: colors.onSurfaceVariant, fontSize: 12}}>
              v{provider.version || '—'} • {sourceLabel}
            </AppText>
            {active ? (
              <MaterialCommunityIcons
                name="check-decagram"
                size={13}
                color={colors.primary}
                style={{marginLeft: 5}}
              />
            ) : null}
          </View>
        </View>

        <View style={{alignItems: 'flex-end', marginLeft: 8}}>
          {bulkStatus === 'failed' ? (
            <StatusChip
              label="Failed"
              bg={colors.errorContainer}
              fg={colors.onErrorContainer}
              icon="alert-circle-outline"
            />
          ) : busy ? (
            <View
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                paddingHorizontal: 8,
              }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 11,
                  marginLeft: 6,
                }}>
                Installing
              </AppText>
            </View>
          ) : installed ? (
            <StatusChip
              label={hasUpdate ? 'Update' : 'Installed'}
              bg={
                hasUpdate
                  ? colors.tertiaryContainer
                  : mode === 'light'
                    ? '#E4EFE3'
                    : 'rgba(120,180,130,0.18)'
              }
              fg={
                hasUpdate
                  ? colors.onTertiaryContainer
                  : mode === 'light'
                    ? '#2F6B3A'
                    : '#A8D6AE'
              }
              icon={hasUpdate ? 'arrow-up-circle-outline' : 'check'}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Install ${provider.display_name}`}
              disabled={busy}
              onPress={onInstall}
              style={{
                alignItems: 'center',
                backgroundColor: colors.primary,
                borderRadius: STREAMX_RADII.pill,
                flexDirection: 'row',
                height: 34,
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}>
              <MaterialCommunityIcons
                name="download"
                size={15}
                color={colors.onPrimary}
              />
              <AppText
                style={{
                  color: colors.onPrimary,
                  fontSize: 12,
                  fontWeight: '700',
                  marginLeft: 5,
                }}>
                Install
              </AppText>
            </Pressable>
          )}
        </View>
      </Pressable>

      {testStatus !== 'untested' || bulkError ? (
        <View style={{paddingHorizontal: 14, paddingBottom: 8}}>
          {bulkError ? (
            <AppText
              numberOfLines={2}
              style={{color: colors.error, fontSize: 11, marginTop: 2}}>
              {bulkError}
            </AppText>
          ) : (
            <ProviderStatusBadge status={testStatus} itemKey={itemKey} />
          )}
        </View>
      ) : null}

      {installed || hasUpdate ? (
        <ProviderCardActions
          provider={provider}
          itemKey={itemKey}
          installed={installed}
          installing={installing}
          testStatus={testStatus}
          hasSettings={hasSettings}
          primary={primary}
          onInstall={onInstall}
          onTest={onTest}
          onUninstall={onUninstall}
          onOpenSettings={onOpenSettings}
          onUpdate={onUpdate}
          hasUpdate={hasUpdate}
          updating={updating}
        />
      ) : null}

      {active ? (
        <View
          pointerEvents="none"
          style={{
            borderColor: colors.primary,
            borderRadius: 22,
            borderWidth: 1.5,
            bottom: 0,
            left: 0,
            opacity: 0.35,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        />
      ) : null}
    </GlassSurface>
  );
};

export default React.memo(ProviderCard);
