'use strict';

const detectTplPath = require('../tpl').detectTplPath;
const { red } = require('colors');

async function pack(options) {

  let tplPath = options.template;
  const bucket = options.ossBucket;
  const outputTemplateFile = options.outputTemplateFile;

  if (!bucket) {
    throw new Error('missing --oss-bucket parameter');
  }

  if (!tplPath) {
    tplPath = await detectTplPath();
  }

  if (!tplPath) {
    throw new Error(red('Current folder not a fun project.'));
  } else {
    await require('../package/package').pack(tplPath, bucket, outputTemplateFile);
  }
}

module.exports = pack;
