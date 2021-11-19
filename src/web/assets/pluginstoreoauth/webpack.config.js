/* jshint esversion: 6 */
/* globals module, require */
const {ConfigFactory} = require('@craftcms/webpack');

module.exports = new ConfigFactory({
  config: {
    entry: {
      'PluginStoreOauthCallback': './PluginStoreOauthCallback.js',
      'parseFragmentString': './parseFragmentString.js',
    },
  }
});
