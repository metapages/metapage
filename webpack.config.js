module.exports = [
	createConfig('metapage', 'window', '/docs/js/'),
	createConfig('metapage', 'window', '/build/npm/'),
	createConfig('metapage', 'commonjs2', '/build/npm/'),

	createConfig('metaframe', 'window', '/docs/js/'),
	createConfig('metaframe', 'window', '/build/npm/'),
	createConfig('metaframe', 'commonjs2', '/build/npm/'),
];

function createConfig(source, target, folder) {
	return {
		mode: 'production',
		// devtool: 'cheap-module-eval-source-map',
		entry: './build-' + source + '.hxml',
		output: {
			// library: source,
			libraryTarget: target,
			filename: (target == 'window' ? 'browser.js' : 'index.js'),
			path: __dirname + folder + source
		},
		module: {
			rules: [
				// all files with hxml extension will be handled by `haxe-loader`
				{
					test: /\.hxml$/,
					loader: 'haxe-loader',
					options: {
						// Webpack builds the production versions, so keep this false
						debug: false,
					}
				}
			]
		}
	};
}
