const path = require('path');
const onBuild = require('on-build-webpack');
const { exec } = require('child_process');

module.exports = [
  // package playback
  {
    entry: './src/index.js',
    output: {
      filename: 'playback.js'
    },
    stats: 'errors-only',
    target: 'node',
    node: {
      __dirname: true,
      __filename: true,
    },
    mode: 'production',
    module: {
      rules: [
          {
            test: /\.ne$/,
            use: [
              'nearley-loader',
            ]
          }
      ]
    }
  },
  
  // bundle and run the test suite
  {
    entry: './test/test.js',
    output: {
      path: path.resolve(__dirname, 'test/'),
      filename: 'test.bundle.js',
      
    },
    stats: 'errors-only',
    target: 'node',
    node: {
      __dirname: true,
      __filename: true,
    },
    mode: 'development',
    module: {
      rules: [
          {
            test: /\.ne$/,
            use: ['nearley-loader']
          }
      ]
    },
    plugins: [
      new onBuild(function(stats) {
        exec('npm run test', (err, stdout, stderr) => {
          if(stdout) console.log(stdout);
          if(err || stderr) {
            console.error(err || stderr);
            console.log(`${new Date()} - failed`);
          } else {
            console.log(`${new Date()} - ok`);
          }
        });
      })
    ]
  }
];
