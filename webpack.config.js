const path = require('path');
const outputPath = 'dist';
const entryPoints = {
  popup: './src/popup.ts',
  background: './src/background.ts',
  injectScript: './src/injectScript.ts'
};

module.exports = {
  entry: entryPoints,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, outputPath)
  }
};
