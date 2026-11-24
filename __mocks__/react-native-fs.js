// Jest stand-in for the native filesystem module. Only the surface that the
// app's synchronous startup path touches is implemented.
const noop = () => {};

module.exports = {
  DocumentDirectoryPath: '/tmp/streamx-documents',
  CachesDirectoryPath: '/tmp/streamx-cache',
  ExternalStorageDirectoryPath: '/tmp/streamx-external',
  ExternalDirectoryPath: '/tmp/streamx-external-files',
  PicturesDirectoryPath: '/tmp/streamx-pictures',
  DownloadDirectoryPath: '/tmp/streamx-downloads',
  TemporaryDirectoryPath: '/tmp/streamx-temp',
  LibraryDirectoryPath: '/tmp/streamx-library',
  MainBundlePath: '/tmp/streamx-bundle',
  exists: async () => false,
  mkdir: async () => undefined,
  unlink: async () => undefined,
  readFile: async () => '',
  writeFile: async () => undefined,
  appendFile: async () => undefined,
  copyFile: async () => undefined,
  moveFile: async () => undefined,
  readDir: async () => [],
  stat: async () => ({size: 0, isFile: () => false, isDirectory: () => true}),
  hash: async () => '',
  touch: async () => undefined,
  scanFile: async () => [],
  getFSInfo: async () => ({freeSpace: 0, totalSpace: 0}),
  downloadFile: () => ({
    jobId: 1,
    promise: Promise.resolve({statusCode: 200, bytesWritten: 0}),
  }),
  stopDownload: noop,
  addListener: noop,
  removeListeners: noop,
};
