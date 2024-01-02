const path = require("path");
const EslintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

/**
 * 处理样式loader
 * @param {string | undefined} pre 某种样式特定的loader，例如 less-loader、sass-loader等
 * @returns 组合好的样式loader配置
 */
const getStyleLoader = (pre) => {
    return [
        "style-loader",
        "css-loader",
        {
            // 处理css兼容性问题需要配合package.json中的browserslist
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: ["postcss-preset-env"], // 智能预设，自动根据browserslist配置添加所需的浏览器前缀
                },
            },
        },
        pre,
    ].filter(Boolean); // 如果没有传参，就把undifined过滤掉
}

module.exports = {
    entry: './src/main.js',
    output: {
        path: undefined,
        filename: "static/js/[name].js",
        chunkFilename: "static/js/[name].chunk.js",
        assetModuleFilename: "static/media/[hash:10][ext][query]",
    },
    module: {
        rules: [
            //处理css
            {
                test: /\.css$/,
                use: getStyleLoader(),
            },
            {
                test: /\.less$/,
                use: getStyleLoader("less-loader"),
            },
            {
                test: /\.s[ac]ss$/,
                use: getStyleLoader("sass-loader")
            },
            {
                test: /\.styl$/,
                use: getStyleLoader("stylus-loader"),
            },
            // 处理图片
            {
                test: /\.(jpe?g|png|gif|webp|svg)$/,
                type: "asset", // webpack 5中处理资源的默认方式，可以将图片文件作为资源模块处理，不需要手动配置loader
                parser: { // 资源模块的解析器
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 将小于10kb的图片转换为base64，减少请求数量
                    }
                }
            },
            // 处理其他资源，如字体图标、视频音频
            {
                test: /\.(ttf|woff2?|map3|map4|avi)$/,
                type: "asset/resource", // 与 asset 的区别是，asset可以转base64，asset/resource直接取源文件
            },
            // 处理js：eslint用plugin处理、babel用loader处理
            // babel用于做js兼容性处理，除了loader之外还需要配合babel配置文件
            {
                test: /\.(jsx|js)$/,
                include: path.resolve(__dirname, "../src"),
                loader: "babel-loader",
                options: {
                    cacheDirectory: true, // 开启缓存
                    cacheCompression: false, //关闭压缩缓存
                    plugins: [
                        'react-refresh/babel', // 激活js的HMR功能
                    ]
                }
            }
        ],
    },
    plugins: [
        new EslintWebpackPlugin({ // 配置Eslint插件，除此之外还需要配合eslint配置文件
            context: path.resolve(__dirname, "../src"), // 指定Eslint解析的根目录，当遇到相对路径的模块导入时，会以该目录作为基准路径解析模块
            exclude: "node_modules", // 默认值，排除node_module不检查
            cache: true, // 开启缓存
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"), // 指定缓存文件路径
        }),
        // 处理html
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "../public/index.html"), // 以public/index.html文件为模板创建新的html文件，自动引入资源
        }),
        new ReactRefreshWebpackPlugin(), // 激活js的HMR功能
    ],
    mode: "development", // 开发模式
    devtool: 'cheap-module-source-map', // 指定source map类型，在开发者工具中精确定位到源代码中的错误和警告
    optimization: { // 配置优化选项
        splitChunks: { // 代码分割
            chunks: "all", // 所有模块进行分割，可以将公共的代码提取出来，避免重复加载
        },
        runtimeChunk: { // 配置运行时代码的分割方式
            name: (entrypoint) => `runtime~${entrypoint.name}.js`, // 给运行时代码模块命名，避免每次打包模块哈希值命名发生变化所导致缓存失效
        }
    },
    // webpack解析模块加载选项
    resolve:{
        // 自动补全文件扩展名
        extensions:[".jsx",".js",".json"],
    },
    devServer: { // 开发服务器：不会输出资源，在内存中编译打包的
        host: "localhost", // 启动服务器域名
        port: "3000", // 启动服务器端口号
        open: true, // 是否自动打开浏览器
        hot: true, // 开启HMR（默认值）
        historyApiFallback: true, // 解决react-router刷新404问题
    },
}