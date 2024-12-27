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
          {
            from: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.min.js'),
            to: path.resolve(__dirname, 'public/pdf.min.js'),
          },
          {
            from: path.resolve(__dirname, 'node_modules/pdfjs-dist/web/pdf_viewer.js'),
            to: path.resolve(__dirname, 'public/pdf_viewer.js'),
          },
          {
            from: path.resolve(__dirname, 'node_modules/pdfjs-dist/web/pdf_viewer.css'),
            to: path.resolve(__dirname, 'public/pdf_viewer.css'),
          },
        ],
      })
    );
    return config;
  },
};
