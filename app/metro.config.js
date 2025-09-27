// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use default resolver paths; no local SDK module linking required
config.resolver.nodeModulesPaths = [path.resolve(__dirname, './node_modules')];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

config.resolver.assetExts.push('.');

// Add Node.js polyfills for React Native
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

module.exports = config;
