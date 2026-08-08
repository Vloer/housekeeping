const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication['$']['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
