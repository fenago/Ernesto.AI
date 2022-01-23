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
		'no-tabs': "off",
		'no-throw-literal': 'off',
		'vue/script-indent': "off",
		'comma-dangle': "off",
		semi: 'off',
		indent: "off",
		quotes: "off",
		camelcase: 'off',
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
