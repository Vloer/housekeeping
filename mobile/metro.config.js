const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch workspace root to allow importing shared server/i18n files
config.watchFolders = [workspaceRoot];

module.exports = config;
