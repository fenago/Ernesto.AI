const path = require('path')

module.exports = {
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    devtool: 'source-map',
  },
  // eslint-disable-next-line no-path-concat
  outputDir: path.resolve(__dirname + '/../backend/public'),
  devServer: {
    proxy: 'http://localhost:8080',
  },
}
