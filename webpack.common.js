const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
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
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src/index.html'),
    }),
    new CopyWebpackPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, 'src/public/'),
      to: path.resolve(__dirname, 'dist/'),
      // Pastikan sw.js tidak diabaikan
      globOptions: {
        ignore: [], // Jangan masukkan sw.js ke dalam ignore list
      },
    },
    // Tambahkan pattern khusus untuk sw.js jika perlu
    {
      from: path.resolve(__dirname, 'src/scripts/sw.js'),
      to: path.resolve(__dirname, 'dist/sw.js'),
    },
  ],
}),
  ],
};