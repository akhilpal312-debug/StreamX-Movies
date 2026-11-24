import {
  extensionStorage,
  type ProviderExtension,
  type ProviderSource,
} from '../storage/extensionStorage';
import {extensionManager} from './ExtensionManager';

export type BulkJobStatus =
  | 'queued'
  | 'installing'
  | 'installed'
  | 'skipped'
  | 'failed'
  | 'cancelled';

export interface BulkJob {
  value: string;
  display_name: string;
  version: string;
  status: BulkJobStatus;
  error?: string;
}

export interface BulkProgress {
  jobs: BulkJob[];
  completed: number;
  total: number;
  running: boolean;
  cancelled: boolean;
  startedAt: number;
}

export interface BulkResult extends BulkProgress {
  installed: number;
  skipped: number;
  failed: number;
  finishedAt: number;
}

/** Downloads run in small batches so the network and provider sandbox stay responsive. */
export const BULK_INSTALL_CONCURRENCY = 3;

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 700;

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const compareProviderVersions = (
  left: string,
  right: string,
): number => {
  const toParts = (value: string) =>
    value
      .split(/[.+-]/)
      .map(part => parseInt(part, 10))
      .map(part => (Number.isFinite(part) ? part : 0));
  const a = toParts(left);
  const b = toParts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const summarize = (
  jobs: BulkJob[],
  running: boolean,
  cancelled: boolean,
  startedAt: number,
): BulkResult => {
  const completed = jobs.filter(
    job => job.status !== 'queued' && job.status !== 'installing',
  ).length;
  return {
    jobs,
    completed,
    total: jobs.length,
    running,
    cancelled,
    startedAt,
    installed: jobs.filter(job => job.status === 'installed').length,
    skipped: jobs.filter(job => job.status === 'skipped').length,
    failed: jobs.filter(job => job.status === 'failed').length,
    finishedAt: Date.now(),
  };
};

/**
 * Installs every compatible provider from a reviewed source.
 *
 * The queue is built from the live manifest: disabled providers are excluded,
 * providers already at (or above) the manifest version are skipped, and each
 * remaining download is validated by the existing ExtensionManager before it is
 * registered. A failed provider is retried once, then reported individually and
 * never blocks the rest of the queue.
 */
class BulkProviderInstaller {
  private running = false;
  private cancelled = false;
  private lastRun: BulkResult | null = null;

  getLastRun(): BulkResult | null {
    return this.lastRun;
  }

  get isRunning(): boolean {
    return this.running;
  }

  cancel(): void {
    if (this.running) {
      this.cancelled = true;
    }
  }

  async installAll(options: {
    source?: ProviderSource;
    onProgress?: (progress: BulkProgress) => void;
  }): Promise<BulkResult> {
    if (this.running) {
      throw new Error('A provider installation is already running');
    }

    const source = options.source ?? extensionStorage.getProviderSource();
    if (!source) {
      throw new Error('No provider source configured');
    }

    this.running = true;
    this.cancelled = false;
    const startedAt = Date.now();
    const emit = (jobs: BulkJob[], running: boolean) =>
      options.onProgress?.({
        jobs,
        completed: jobs.filter(
          job => job.status !== 'queued' && job.status !== 'installing',
        ).length,
        total: jobs.length,
        running,
        cancelled: this.cancelled,
        startedAt,
      });

    let jobs: BulkJob[] = [];
    try {
      const manifest = await extensionManager.fetchManifest(source, true);
      const installed = extensionStorage.getInstalledProviders() || [];
      const installedByValue = new Map(
        installed.map(item => [item.value, item] as const),
      );

      const compatible = manifest.filter(
        (provider): provider is ProviderExtension =>
          Boolean(provider?.value && provider?.version && !provider.disabled),
      );

      jobs = compatible.map(provider => {
        const current = installedByValue.get(provider.value);
        const upToDate =
          current &&
          compareProviderVersions(current.version, provider.version) >= 0;
        return {
          value: provider.value,
          display_name: provider.display_name || provider.value,
          version: provider.version,
          status: upToDate ? ('skipped' as const) : ('queued' as const),
        };
      });

      emit(jobs, true);

      const byValue = new Map(compatible.map(item => [item.value, item]));
      let cursor = 0;

      const worker = async () => {
        while (cursor < jobs.length) {
          if (this.cancelled) return;
          const job = jobs[cursor++];
          if (!job || job.status !== 'queued') continue;
          const provider = byValue.get(job.value);
          if (!provider) {
            job.status = 'failed';
            job.error = 'Provider missing from manifest';
            emit(jobs, true);
            continue;
          }

          job.status = 'installing';
          emit(jobs, true);

          let lastError: unknown;
          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            if (this.cancelled) break;
            try {
              await extensionManager.installProvider(provider);
              const registered = extensionStorage.isProviderInstalled(
                provider.value,
                source.author,
              );
              if (!registered) {
                throw new Error('Provider files did not pass validation');
              }
              job.status = 'installed';
              job.error = undefined;
              lastError = undefined;
              break;
            } catch (error) {
              lastError = error;
              if (attempt < MAX_ATTEMPTS) {
                await delay(RETRY_DELAY_MS);
              }
            }
          }

          if (job.status !== 'installed') {
            if (this.cancelled) {
              job.status = 'cancelled';
            } else {
              job.status = 'failed';
              job.error =
                lastError instanceof Error
                  ? lastError.message
                  : 'Installation failed';
            }
          }
          emit(jobs, true);
        }
      };

      await Promise.all(
        Array.from(
          {length: Math.min(BULK_INSTALL_CONCURRENCY, jobs.length)},
          () => worker(),
        ),
      );

      // Anything still queued was not reached because the run was cancelled.
      jobs.forEach(job => {
        if (job.status === 'queued') job.status = 'cancelled';
      });

      const result = summarize(jobs, false, this.cancelled, startedAt);
      this.lastRun = result;
      options.onProgress?.(result);
      return result;
    } finally {
      this.running = false;
      this.cancelled = false;
    }
  }
}

export const bulkProviderInstaller = new BulkProviderInstaller();
