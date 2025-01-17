#!/usr/bin/env node

/* eslint-disable quotes */

'use strict';

const program = require('commander');
const getVisitor = require('../lib/visitor').getVisitor;
const notifier = require('../lib/update-notifier');

program
  .name('fun package')
  .usage('[options]')
  .description('packages the local artifacts to oss. In order that you can deploy your application directly through a template file') 
  .option('-t, --template <template>', 'the template file path')
  .option('-b, --oss-bucket <bucket>', 'the name of the oss bucket where Fun uploads local artifacts')
  .option('-o, --output-template-file <filename>', 'the output path of the packaged template file')
  .parse(process.argv);

if (program.args.length > 1) {
  console.error();
  console.error("  error: unexpected argument '%s'", program.args[1]);
  program.help();
}

notifier.notify();

getVisitor().then(visitor => {

  visitor.pageview('/fun/deploy').send();

  require('../lib/commands/package')(program)
    .then(() => {
      visitor.event({
        ec: 'package',
        ea: 'package',
        el: 'success',
        dp: '/fun/package'
      }).send();
    })
    .catch(error => {
      visitor.event({
        ec: 'package',
        ea: 'package',
        el: 'error',
        dp: '/fun/package'
      }).send();
  
      require('../lib/exception-handler')(error);
    });
});
