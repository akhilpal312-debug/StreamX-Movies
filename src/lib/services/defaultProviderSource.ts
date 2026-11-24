import {DEFAULT_PROVIDER_SOURCE} from '../constants';
import {extensionStorage, type ProviderSource} from '../storage/extensionStorage';
import {createProviderSource} from '../utils/helpers';

/**
 * Seeds the Zenda Cross provider repository as the default source on a fresh
 * install. Existing sources are never overwritten, so a user who configured
 * their own repository keeps it.
 */
export const ensureDefaultProviderSource = (
  repository = DEFAULT_PROVIDER_SOURCE,
): ProviderSource | undefined => {
  if (extensionStorage.getProviderSources().length > 0) {
    return extensionStorage.getProviderSource();
  }

  try {
    const source = createProviderSource(repository);
    extensionStorage.addProviderSources(
      source.author,
      source.url,
      source.manifestUrl,
    );
    extensionStorage.setDefaultProviderSource(source.author);
    return extensionStorage.getProviderSource();
  } catch (error) {
    console.warn('Failed to configure the default provider source:', error);
    return undefined;
  }
};
