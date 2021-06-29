const path = require('path')

module.exports = {
  devServer: {
    disableHostCheck: true,
  },

  transpileDependencies: ['vuetify'],
  // eslint-disable-next-line no-path-concat
  outputDir: path.resolve(__dirname + '/../backend/public'),
}
