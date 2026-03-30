const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude build artifacts from node_modules to prevent Metro watch errors
config.watchFolders = [__dirname];

// Block watching build directories in node_modules
config.resolver = {
  ...config.resolver,
  blockList: [
    // Block Android build directories in node_modules
    /.*\/node_modules\/.*\/android\/build\/.*/,
    /.*\/node_modules\/.*\/android\/\.gradle\/.*/,
    /.*\/node_modules\/.*\/ios\/build\/.*/,
    /.*\/node_modules\/.*\/ios\/Pods\/.*/,
    // Specifically block react-native-worklets build directory
    /.*\/react-native-worklets\/android\/build\/.*/,
  ],
};

// Exclude build directories from being watched
config.watcher = {
  ...config.watcher,
  additionalExts: ['cjs', 'mjs'],
  healthCheck: {
    enabled: true,
  },
};

module.exports = config;





