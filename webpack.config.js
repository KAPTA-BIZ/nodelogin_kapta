var webpack = require('webpack');
var path = require('path');

const config = {
   entry: {
     index: path.resolve(__dirname, './src/views/index.js')
   },
   output: {
     path: path.resolve(__dirname, './build'),
     filename: 'js/[name].js'
   },
   module: {
    rules: [
     {
       test: /(\.css)$/,
       use: {
           loader: "css-loader" // translates CSS into CommonJS
       }
     },
     {
       test: /\.(jsx|js)?$/,
       use: [{
         loader: "babel-loader",
         options: {
           cacheDirectory: true,
           presets: ['react', 'es2015'] // Transpiles JSX and ES6
         }
       }]
     }
    ],

  }
};

module.exports = config;