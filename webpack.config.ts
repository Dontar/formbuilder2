import * as webpack from 'webpack';
import * as path from 'path';
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as CopyPlugin from "copy-webpack-plugin";

const buildPath = path.resolve(__dirname, 'app');

const config: webpack.Configuration[] = [{
	entry: "./src/browser/FormBuilder.ts",
	output: {
		filename: "browser.[hash].js",
		path: buildPath
	},
	target: "electron-renderer",
	// Enable sourcemaps for debugging webpack's output.
	devtool: "source-map",

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'Custom template using Handlebars',
			template: 'src/assets/index.html'
		})
	],
	module: {
		rules: [
			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			// { test: /\.html$/, loader: "html-loader" },
			{ test: /\.tsx?$/, use: "awesome-typescript-loader" },
			{ test: /\.js$/, use: "source-map-loader" },
			{ test: /\.css$/, use: ["style-loader", "css-loader"] },
			{ test: /\.tpl$/, use: ["raw-loader"] }
		]

	}
}, {
	entry: "./src/main/main.ts",
	output: {
		filename: "main.js",
		path: buildPath
	},
	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
	},
	target: "electron-main",
	plugins: [
		new HtmlWebpackPlugin({
			title: 'Custom template using Handlebars',
			template: 'src/assets/package.json'
		})
	],
	// Enable sourcemaps for debugging webpack's output.
	module: {
		rules: [
			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			// { test: /\.html$/, loader: "html-loader" },
			{ test: /\.tsx?$/, use: "awesome-typescript-loader" }
		]

	}
}];

export default config;
