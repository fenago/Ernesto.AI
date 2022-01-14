module.exports = {
  root: true,

  env: {
    node: true,
  },

  plugins: ['vuetify'],

  extends: 'vuetify',

  parserOptions: {
    parser: 'babel-eslint',
  },

  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'template-curly-spacing': 'off',
    indent: 'off',
    'no-unused-vars': 'warn',
    "no-throw-literal": "off"
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
}
