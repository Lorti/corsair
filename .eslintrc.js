module.exports = {
    'extends': 'airbnb-base',
    'rules': {
        'indent': ['error', 4],
        'max-len': ['warn', 120],
        'no-mixed-operators': 'off',
        'no-plusplus': 'off',
        'no-shadow': 'off',
    },
    'env': {
        'browser': true,
    },
    settings: {
        'import/resolver': 'webpack',
    },
};
