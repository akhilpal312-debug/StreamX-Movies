// Jest stand-in for expo-file-system used by the synchronous startup path.
module.exports = {
  documentDirectory: '/tmp/streamx-documents/',
  cacheDirectory: '/tmp/streamx-cache/',
  bundleDirectory: '/tmp/streamx-bundle/',
  getInfoAsync: async () => ({exists: false, isDirectory: false}),
  makeDirectoryAsync: async () => undefined,
  deleteAsync: async () => undefined,
  copyAsync: async () => undefined,
  moveAsync: async () => undefined,
  writeAsStringAsync: async () => undefined,
  readAsStringAsync: async () => '',
  readDirectoryAsync: async () => [],
  downloadAsync: async () => ({uri: '', status: 200}),
  createDownloadResumable: () => ({
    downloadAsync: async () => ({uri: '', status: 200}),
    pauseAsync: async () => ({}),
    resumeAsync: async () => ({}),
  }),
  StorageAccessFramework: {},
  EncodingType: {UTF8: 'utf8', Base64: 'base64'},
};
