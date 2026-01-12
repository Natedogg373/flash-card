const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Windows "node:sea" folder naming error
config.resolver.unstable_enablePackageExports = false;

module.exports = config;