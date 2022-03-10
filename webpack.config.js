const path                   = require("path");
const TerserWebpackPlugin    = require("terser-webpack-plugin");
const MiniCssExtractPlugin   = require('mini-css-extract-plugin');
const HtmlWebpackPlugin      = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = env => {
    return make({ config: env.config, repo: "portfolio" });
};

function make(options) {
    const { config: configName, repo } = options;

    const src_dir      = path.resolve(__dirname, "src");
    const dist_dir     = path.resolve(__dirname, "dist");
    const gh_pages_dir = path.resolve(__dirname, "gh-pages");

    const cleanWebpackPlugin = new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ["**/*", "!.git/**"]
    });

    const htmlWebpackPlugin = new HtmlWebpackPlugin({
        template: path.resolve(src_dir, "index.hbs"),
        inject:   false
    });

    const miniCssExtractPlugin = new MiniCssExtractPlugin({
        filename: "static/css/[name].[fullhash].css"
    });

    const configs = {
        "development": {
            mode:        "development",
            devtool:     "inline-source-map",
            styleLoader: "style-loader",
            outputPath:  dist_dir,
            publicPath:  "/",
            plugins:     [cleanWebpackPlugin, htmlWebpackPlugin]
        },
        "production": {
            mode:        "production",
            devtool:     false,
            styleLoader: MiniCssExtractPlugin.loader,
            outputPath:  dist_dir,
            publicPath:  "/",
            plugins:     [miniCssExtractPlugin, cleanWebpackPlugin, htmlWebpackPlugin]
        },
        "gh-pages": {
            mode:        "production",
            devtool:     false,
            styleLoader: MiniCssExtractPlugin.loader,
            outputPath:  gh_pages_dir,
            publicPath:  `/${repo}/`,
            plugins:     [miniCssExtractPlugin, cleanWebpackPlugin, htmlWebpackPlugin]
        }
    };

    const config = configs[configName];

    const result = {
        mode: config.mode,
        target: "web",
        entry: {
            main: [
                path.resolve(src_dir, "index.tsx"),
            ]
        },
        output: {
            filename:   "static/js/[name].[fullhash].js",
            path:       config.outputPath,
            publicPath: config.publicPath
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: ["babel-loader", "ts-loader"]
                },
                {
                    test: /\.(scss|css)$/,
                    use: [
                        config.styleLoader,
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    config: "postcss.config.js"
                                }
                            }
                        },
                        "sass-loader"
                    ]
                },
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader",
                },
                {
                    test: /\.svg$/,
                    use: ["@svgr/webpack"]
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: "static/images/[name][ext]"
                    }
                }
            ]
        },
        resolve: {
            alias: {
                "@root":       src_dir,
                "@assets":     path.resolve(src_dir, "assets"),
                "@components": path.resolve(src_dir, "components")
            },
            extensions: [".js", ".jsx", ".json", ".ts", ".tsx"]
        },
        devServer: {
            static: { directory: dist_dir },
            hot: true
        },
        devtool: config.devtool,
        plugins: config.plugins,
        optimization: {
            minimizer: [
                new TerserWebpackPlugin({
                    terserOptions: {
                        format: {comments: false},
                        compress: {drop_console: true}
                    },
                    extractComments: false
                })
            ]
        }
    };

    return result;
}
