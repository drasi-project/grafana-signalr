const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');

const config = (env) => {
  const isDevelopment = env.development || process.env.NODE_ENV === 'development';

  return {
    cache: false,
    context: path.join(process.cwd(), 'src'),
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    entry: {
      module: './module.ts',
    },
    externals: [
      'lodash',
      'jquery',
      'moment',
      'slate',
      'prismjs',
      'slate-plain-serializer',
      '@grafana/slate-react',
      '@grafana/data',
      '@grafana/ui',
      '@grafana/runtime',
      'react', 
      'react-dom',
      'rxjs',
      'react-router',
      'react-router-dom',
      'd3',
      'angular',
      '@emotion/react',
      '@emotion/css',
      'systemjs'
    ],
    mode: isDevelopment ? 'development' : 'production',
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
                target: 'es2018',
                loose: false,
                externalHelpers: false,
                keepClassNames: false,
                transform: {
                  react: {
                    pragma: 'React.createElement',
                    pragmaFrag: 'React.Fragment',
                    throwIfNamespace: true,
                    development: isDevelopment,
                    useBuiltins: false,
                  },
                  optimizer: {
                    globals: {
                      vars: {
                        __DEBUG__: 'true',
                      },
                    },
                  },
                },
              },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.s[ac]ss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[hash][ext][query]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[hash][ext][query]',
          },
        },
      ],
    },
    output: {
      clean: true,
      path: path.join(process.cwd(), 'dist'),
      libraryTarget: 'amd',
      filename: '[name].js',
      publicPath: '/',
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'plugin.json', to: '.' },
          { from: '../README.md', to: '.' },
          { from: '../CHANGELOG.md', to: '.' },
          { from: '../LICENSE', to: '.' },
          { from: 'img/**/*', to: '.', noErrorOnMissing: true },
          // { from: '../MANIFEST.txt', to: '.' }, // Removed to avoid signature issues
        ],
      }),
      new ReplaceInFileWebpackPlugin([
        {
          dir: 'dist',
          files: ['plugin.json'],
          rules: [
            {
              search: '%VERSION%',
              replace: require('../../package.json').version,
            },
            {
              search: '%TODAY%',
              replace: new Date().toISOString().substr(0, 10),
            },
          ],
        },
      ]),
      ...(isDevelopment ? [new LiveReloadPlugin()] : []),
      new ForkTsCheckerWebpackPlugin({
        async: isDevelopment,
        issue: {
          include: [{ file: '**/*.{ts,tsx}' }],
        },
        typescript: {
          configFile: path.join(process.cwd(), 'tsconfig.json'),
        },
      }),
      new ESLintPlugin({
        extensions: ['.ts', '.tsx'],
        lintDirtyModulesOnly: isDevelopment,
      }),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      unsafeCache: true,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  };
};

module.exports = config;