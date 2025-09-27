const createConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async (env, argv) => {
  const config = await createConfigAsync(
    {
      ...env,
      babel: {},
    },
    argv
  );
  config.resolve.modules = [path.resolve(__dirname, './node_modules')];

  // Add Node.js polyfills for web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer'),
  };

  // Provide Buffer global for web
  config.plugins.push(
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};
