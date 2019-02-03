module.exports = [
	createConfig('window'),
	createConfig('commonjs2'),
];

function createConfig(target) {
	return {
		mode: 'development',
		devtool: 'cheap-module-eval-source-map',
		entry: {
			metapage: './build-metapage.hxml',
			metaframe: './build-metaframe.hxml'
		},
		output: {
			// library: {
			//   // 'window': 'metapage-browser',
			//   'commonjs': 'metapage-npm',
			// },
			library: '[name]',
			// libraryTarget: 'window',
			libraryTarget: target,
			filename: '[name]' + (target != 'window' ? '.library' : '') + '.js',
			path: __dirname + '/docs/js'
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
// module.exports = {
// 	mode: 'development',
// 	devtool: 'cheap-module-eval-source-map',
// 	entry: {
// 		metapage: './build-metapage.hxml',
// 		metaframe: './build-metaframe.hxml'
// 	},
// 	output: {
// 		// library: {
// 		//   // 'window': 'metapage-browser',
// 		//   'commonjs': 'metapage-npm',
// 		// },
// 		library: 'metapage',
// 		// libraryTarget: 'window',
// 		libraryTarget: 'umd',
// 		filename: '[name].js',
// 		path: __dirname + '/docs/js'
// 	},
// 	module: {
// 		rules: [
// 			// all files with hxml extension will be handled by `haxe-loader`
// 			{
// 				test: /\.hxml$/,
// 				loader: 'haxe-loader',
// 				options: {
// 					debug: true,
// 				}
// 			}
// 		]
// 	},
// 	watchOptions: {
// 		ignored: /node_modules/
// 	}
// }