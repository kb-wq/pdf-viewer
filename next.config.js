const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
            to: path.resolve(__dirname, 'public/pdf.worker.min.js'),
          },
        ],
      })
    );
    return config;
  },
};
