const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
   output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/dicoding-story-app/' 
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 70000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins: [
    new WorkboxWebpackPlugin.GenerateSW({
      swDest: './sw.bundle.js',
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      // Penting: Tambahkan importScripts untuk menyertakan kode push notification
      importScripts: ['./sw-push.js'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/story-api\.dicoding\.dev\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'dicoding-story-api',
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Di webpack.prod.js, tambahkan pada runtimeCaching
        {

          urlPattern: new RegExp('https://story-api\\.dicoding\\.dev/v1/stories/story-'),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'story-details',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, 
              },
            },
          },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Hari
            },
          },
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
          },
        },
      ],
    }),
    new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'src/404.html'),
        to: path.resolve(__dirname, 'dist')
      }
    ]
  })
  ],
});