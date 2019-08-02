'use strict';

const { resolveLocalPath, parseNasPath, isNasProtocol } = require('./path');
const debug = require('debug')('fun:nas:cp');
const { isDir, isFile } = require('./cp/file');
const upload = require('./cp/upload');
const { getNasHttpTriggerPath } = require('./request');

async function cp(srcPath, dstPath, recursive) {
  if (srcPath === undefined || dstPath === undefined) {
    console.log('Input path empty error, please input again!');
    return;
  }

  debug('cp ' + (recursive ? '-R ' : '') + srcPath + ' to ' + dstPath);

  if (isNasProtocol(srcPath) && !isNasProtocol(dstPath)) {
    //nas => local
    throw new Error('Not support NAS file download now!');
  } else if (!isNasProtocol(srcPath) && isNasProtocol(dstPath)) {
    //local => nas
    if (await isDir(srcPath) && !recursive) {
      throw new Error('Can not copy folder without option -R/--recursive');
    }

    if (await isFile(srcPath) && recursive) {
      throw new Error('Can not copy file with option -R/--recursive');
    }

    const resolvedSrc = resolveLocalPath(srcPath);

    const { nasPath: resolvedDst, serviceName } = parseNasPath(dstPath);

    const nasHttpTriggerPath = await getNasHttpTriggerPath(serviceName);

    await upload(resolvedSrc, resolvedDst, nasHttpTriggerPath, recursive);

  } else if (isNasProtocol(srcPath) && isNasProtocol(dstPath)) {
    //nas => nas
    throw new Error('Not support copy NAS files to another NAS!');
  } else {
    throw new Error('Format of path not support');
  }
}

module.exports = cp;