const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: 'production',
  context: path.resolve(__dirname, 'src'),
  entry: {
    index: './index.tsx'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{loader: 'ts-loader', options: {
            configFile: "tsconfig.prod.json"
          }}],
        exclude: [ /node_modules/ ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
  },
  optimization: {
    minimize: false,
    minimizer: [new TerserPlugin()],
  }
}
