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
		'no-unused-vars': 'warn',
		"semi": 'off',
		'indent': "off",
		'vue/script-indent': ['warn', 2, {
			'baseIndent': 1
		}],
		"quotes": "off",
		'camelcase': 'off',
		"comma-dangle": "off",
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
