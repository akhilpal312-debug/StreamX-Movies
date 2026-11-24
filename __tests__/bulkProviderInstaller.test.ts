const mockFetchManifest = jest.fn();
const mockInstallProvider = jest.fn();
const mockGetInstalledProviders = jest.fn();
const mockIsProviderInstalled = jest.fn();

jest.mock('../src/lib/services/ExtensionManager', () => ({
  extensionManager: {
    fetchManifest: (...args: unknown[]) => mockFetchManifest(...args),
    installProvider: (...args: unknown[]) => mockInstallProvider(...args),
  },
}));

jest.mock('../src/lib/storage/extensionStorage', () => ({
  extensionStorage: {
    getProviderSource: () => ({
      author: 'Zenda-Cross',
      url: 'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main',
      isDefault: true,
    }),
    getInstalledProviders: (...args: unknown[]) =>
      mockGetInstalledProviders(...args),
    isProviderInstalled: (...args: unknown[]) =>
      mockIsProviderInstalled(...args),
  },
}));

import {
  bulkProviderInstaller,
  compareProviderVersions,
} from '../src/lib/services/bulkProviderInstaller';

const provider = (
  value: string,
  version: string,
  disabled = false,
): {
  value: string;
  display_name: string;
  source: {author: string; url: string};
  version: string;
  icon: string;
  disabled: boolean;
  type: 'global';
  installed: boolean;
} => ({
  value,
  display_name: value,
  source: {author: 'Zenda-Cross', url: 'https://example.test'},
  version,
  icon: '',
  disabled,
  type: 'global',
  installed: false,
});

describe('bulkProviderInstaller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsProviderInstalled.mockReturnValue(true);
  });

  it('compares provider versions numerically', () => {
    expect(compareProviderVersions('2.10', '2.9')).toBeGreaterThan(0);
    expect(compareProviderVersions('1.0', '1.0')).toBe(0);
    expect(compareProviderVersions('1.0.1', '1.1')).toBeLessThan(0);
  });

  it('installs only compatible providers and skips up-to-date ones', async () => {
    mockFetchManifest.mockResolvedValue([
      provider('zenda', '1.0'),
      provider('moviehub', '2.1'),
      provider('cine', '1.2'),
      provider('retired', '1.0', true),
    ]);
    mockGetInstalledProviders.mockReturnValue([
      {...provider('zenda', '1.0'), installed: true},
      {...provider('other', '0.1'), installed: true},
    ]);
    mockInstallProvider.mockResolvedValue(undefined);

    const progress: number[] = [];
    const result = await bulkProviderInstaller.installAll({
      onProgress: state => progress.push(state.completed),
    });

    expect(result.total).toBe(3);
    expect(result.skipped).toBe(1);
    expect(result.installed).toBe(2);
    expect(result.failed).toBe(0);
    expect(mockInstallProvider).toHaveBeenCalledTimes(2);
    expect(mockInstallProvider.mock.calls.map(call => call[0].value)).toEqual(
      expect.arrayContaining(['moviehub', 'cine']),
    );
    expect(progress.length).toBeGreaterThan(0);
  });

  it('retries a failing provider once and reports it without blocking others', async () => {
    mockFetchManifest.mockResolvedValue([
      provider('broken', '1.0'),
      provider('working', '1.0'),
    ]);
    mockGetInstalledProviders.mockReturnValue([]);
    mockInstallProvider.mockImplementation(async (item: {value: string}) => {
      if (item.value === 'broken') {
        throw new Error('404 Not Found');
      }
    });

    const result = await bulkProviderInstaller.installAll({});

    expect(result.installed).toBe(1);
    expect(result.failed).toBe(1);
    const brokenJob = result.jobs.find(job => job.value === 'broken');
    expect(brokenJob?.status).toBe('failed');
    expect(brokenJob?.error).toContain('404');
    expect(
      mockInstallProvider.mock.calls.filter(call => call[0].value === 'broken'),
    ).toHaveLength(2);
  });

  it('stops queuing providers when cancelled', async () => {
    const items = Array.from({length: 6}, (_, index) =>
      provider(`provider-${index}`, '1.0'),
    );
    mockFetchManifest.mockResolvedValue(items);
    mockGetInstalledProviders.mockReturnValue([]);
    mockInstallProvider.mockResolvedValue(undefined);

    const result = await bulkProviderInstaller.installAll({
      onProgress: state => {
        if (state.completed > 0) {
          bulkProviderInstaller.cancel();
        }
      },
    });

    expect(result.cancelled).toBe(true);
    expect(result.jobs.some(job => job.status === 'cancelled')).toBe(true);
    expect(mockInstallProvider.mock.calls.length).toBeLessThan(items.length);
  });
});
