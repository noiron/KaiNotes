const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './main.jsx'),
  output: {
    filename: 'tags-search-webview.js',
    path: path.resolve(__dirname, '../../media/'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      }
    ],
  },
  devServer: {
    hot: true,
  },
  // externals: {
  //   react: 'React',
  //   'react-dom': 'ReactDOM',
  // },
};
