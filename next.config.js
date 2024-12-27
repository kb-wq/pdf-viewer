module.exports = {
  reactStrictMode: false,
  // ...existing code...
  webpack: (config) => {
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      use: 'file-loader',
    });
    return config;
  },
};
