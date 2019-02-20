module.exports = [
	createConfig('metapage', 'window'),
	createConfig('metapage', 'commonjs2'),
	createConfig('metaframe', 'window'),
	createConfig('metaframe', 'commonjs2'),
];

function createConfig(source, target) {
	return {
		mode: 'development',
		devtool: 'cheap-module-eval-source-map',
		entry: './build-' + source + '.hxml',
		output: {
			library: source,
			libraryTarget: target,
			filename: 'index.js',
			path: __dirname + (target == 'window' ? '/docs/js/' : '/build/npm/') + source
		},
		module: {
			rules: [
				// all files with hxml extension will be handled by `haxe-loader`
				{
					test: /\.hxml$/,
					loader: 'haxe-loader',
					options: {
						debug: true,
					}
				}
			]
		}
	};
}
