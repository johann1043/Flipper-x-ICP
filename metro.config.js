const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves .cjs files
config.resolver.sourceExts.push('cjs');

module.exports = config;
