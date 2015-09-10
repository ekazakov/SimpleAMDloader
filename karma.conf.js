'use strict'

'use strict'

var webpack = require('webpack');

module.exports = function(config) {
    config.set({
        plugins: [
            require('karma-webpack'),
            require('karma-mocha'),
            require('karma-chai'),
            require('karma-chrome-launcher'),
            require('karma-phantomjs-launcher'),
            require('karma-spec-reporter'),
        ],

        basePath: '',
        frameworks: [ 'mocha', 'chai' ],
        files: [
            'test/index.js',
            {pattern: 'test/fixtures/**', included: false},
        ],

        preprocessors: {
            'test/index.js': [ 'webpack' ]
        },


        webpack: {
            //node : {
            //    fs: 'empty'
            //},

            module: {
                loaders: [
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: "babel-loader",
                        query: {
                            blacklist: ["strict"]
                        }
                    }
                ]
            },

            debug: true,

            devtool: "inline-source-map"
        },

        webpackMiddleware: {
            noInfo: true
        },

        reporters: [ 'spec' ],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false
    })
};
