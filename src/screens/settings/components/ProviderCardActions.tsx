import {MaterialCommunityIcons} from '@expo/vector-icons';
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {TVFocusable} from '../../../components/tv';
import {useM3Colors} from '../../../theme/M3PaletteContext';
import type {ProviderExtension} from '../../../lib/storage/extensionStorage';
import type {ProviderTestStatus} from './ProviderStatusBadge';
import AppText from '../../../components/ui/Text';
import {useStreamXTheme} from '../../../theme/useStreamXTheme';

interface ProviderCardActionsProps {
  provider: ProviderExtension;
  itemKey: string;
  installed: boolean;
  installing: boolean;
  testStatus: ProviderTestStatus;
  hasSettings?: boolean;
  primary: string;
  onInstall: () => void;
  onTest: () => void;
  onUninstall: () => void;
  onOpenSettings?: () => void;
  onUpdate: () => void;
  hasUpdate: boolean;
  updating: boolean;
}

const ActionChip = ({
  label,
  icon,
  onPress,
  disabled,
  tone = 'glass',
  loading,
  accessibilityLabel,
  testID,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
  tone?: 'glass' | 'gold' | 'danger';
  loading?: boolean;
  accessibilityLabel: string;
  testID?: string;
}) => {
  const colors = useM3Colors();
  const {glass, mode} = useStreamXTheme();
  const tint =
    tone === 'gold'
      ? {bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer}
      : tone === 'danger'
        ? {bg: colors.errorContainer, fg: colors.onErrorContainer}
        : {
            bg: mode === 'light' ? 'rgba(255,255,255,0.44)' : 'rgba(255,255,255,0.07)',
            fg: colors.onSurface,
          };

  return (
    <TVFocusable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      borderRadius={14}
      focusScale={1.04}
      style={{
        alignItems: 'center',
        backgroundColor: tint.bg,
        borderColor: glass.borderSoft,
        borderRadius: 14,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        height: 38,
        justifyContent: 'center',
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
      }}>
      {loading ? (
        <ActivityIndicator size="small" color={tint.fg} />
      ) : (
        <MaterialCommunityIcons name={icon} size={15} color={tint.fg} />
      )}
      <AppText
        numberOfLines={1}
        style={{
          color: tint.fg,
          fontSize: 11.5,
          fontWeight: '700',
          marginLeft: 4,
        }}>
        {label}
      </AppText>
    </TVFocusable>
  );
};

export const ProviderCardActions: React.FC<ProviderCardActionsProps> = ({
  provider,
  itemKey,
  installed: _installed,
  installing,
  testStatus,
  hasSettings,
  onTest,
  onUninstall,
  onOpenSettings,
  onUpdate,
  hasUpdate,
  updating,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 12,
        paddingHorizontal: 14,
        paddingTop: 2,
      }}>
      {hasUpdate ? (
        <ActionChip
          label={updating ? 'Updating' : 'Update'}
          icon="update"
          tone="gold"
          onPress={onUpdate}
          disabled={updating}
          loading={updating}
          accessibilityLabel={`Update ${provider.display_name}`}
          testID={`update-provider-${itemKey}`}
        />
      ) : null}
      <ActionChip
        label={testStatus === 'testing' ? 'Testing' : 'Test'}
        icon="flask-outline"
        onPress={onTest}
        disabled={testStatus === 'testing'}
        loading={testStatus === 'testing'}
        accessibilityLabel={`Test ${provider.display_name}`}
        testID={`test-provider-${itemKey}`}
      />
      {hasSettings && onOpenSettings ? (
        <ActionChip
          label="Settings"
          icon="cog-outline"
          onPress={onOpenSettings}
          accessibilityLabel={`Settings for ${provider.display_name}`}
          testID={`settings-provider-${itemKey}`}
        />
      ) : null}
      <ActionChip
        label={installing ? 'Removing' : 'Remove'}
        icon="delete-outline"
        tone="danger"
        onPress={onUninstall}
        accessibilityLabel={`Uninstall ${provider.display_name}`}
        testID={`uninstall-provider-${itemKey}`}
      />
    </View>
  );
};
