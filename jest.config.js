module.exports = {
  preset: '@react-native/jest-preset',
  // Expo and the native modules this app ships publish untranspiled ESM.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-tvos)?|@react-native/.*|expo|expo-.*|@expo/.*|react-native-.*|@dr\\.pogodin/.*|@shopify/.*|@notifee/.*|@gorhom/.*|@tanstack/.*|nativewind|react-native-css-interop)/)',
  ],
  moduleNameMapper: {
    '^expo-blur$': '<rootDir>/__mocks__/expo-blur.js',
    '^react-native-linear-gradient$':
      '<rootDir>/__mocks__/react-native-linear-gradient.js',
    '^@dr\\.pogodin/react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^expo-file-system(/legacy)?$': '<rootDir>/__mocks__/expo-file-system.js',
    '\\.(css)$': '<rootDir>/__mocks__/style-mock.js',
    '^@expo/ui/jetpack-compose$':
      '<rootDir>/__mocks__/expo-ui-jetpack-compose.js',
    '^@expo/ui/jetpack-compose/modifiers$':
      '<rootDir>/__mocks__/expo-ui-jetpack-compose-modifiers.js',
  },
};
