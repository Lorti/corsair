module.exports = {
    entry: {
        main: './src/main.js',
    },
    output: {
        filename: '[name].js',
        path: __dirname,
    },
    module: {
        loaders: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }],
    },
};
