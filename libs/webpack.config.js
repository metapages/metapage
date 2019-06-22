const path = require('path');
const configs = [];

['metapage', 'metaframe'].forEach((libName) => {
	['window', 'commonjs2'].forEach((platform) => {
		if (platform === 'window') {
			configs.push(createConfig(libName, platform, '/../docs/js/', true));		
		}
		configs.push(createConfig(libName, platform, '/build/npm/', false));
		configs.push(createConfig(libName, platform, '/build/npm/', true));
	});
});

function createConfig(source, target, folder, isDebug) {
	return {
		mode: isDebug ? 'development' : 'production',
		devtool: isDebug ? 'cheap-module-eval-source-map' : undefined,
		entry: './build-' + source + '.hxml',
		output: {
			// library: source,
			libraryTarget: target,
			filename: (target === 'window' ? 'browser' : 'index') + (isDebug ? '.js' : '.min.js'),
			path: path.join(__dirname + folder + source),
		},
		module: {
			rules: [
				// all files with hxml extension will be handled by `haxe-loader`
				{
					test: /\.hxml$/,
					loader: 'haxe-loader',
					options: {
						// Webpack builds the production versions, so keep this false
						debug: isDebug,
					}
				}
			]
		}
	};
}

module.exports = configs;
