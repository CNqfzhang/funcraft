'use strict';

const debug = require('debug')('fun:local');

const { green, yellow } = require('colors');

const HttpInvoke = require('../../local/http-invoke');
const ApiInvoke = require('../../local/api-invoke');
const fc = require('../../fc');
const { red } = require('colors');

function printHttpTriggerTips(serverPort, serviceName, functionName, triggerName, endpoint, httpMethods, authType) {
  console.log(green(`http trigger ${triggerName} of ${serviceName}/${functionName} was registered`));
  console.log('\turl: ' + yellow(`http://localhost:${serverPort}${endpoint}/`));
  console.log(`\tmethods: ` + yellow(httpMethods));
  console.log(`\tauthType: ` + yellow(authType));
}

async function registerHttpTriggers(app, serverPort, httpTriggers, debugPort, debugIde, baseDir) {
  for (let httpTrigger of httpTriggers) {
    await registerSingleHttpTrigger(app, serverPort, httpTrigger, debugPort, debugIde, baseDir);
  }

  console.log();
}

async function registerSingleHttpTrigger(app, serverPort, httpTrigger, debugPort, debugIde, baseDir, eager = false) {
  const { serviceName, serviceRes,
    functionName, functionRes,
    triggerName, triggerRes } = httpTrigger;
  
  debug('serviceName: ' + serviceName);
  debug('functionName: ' + functionName);
  debug('tiggerName: ' + triggerName);
  debug('triggerRes: ' + triggerRes);

  const endpointPrefix = `/2016-08-15/proxy/${serviceName}/${functionName}`;
  const endpoint = `${endpointPrefix}*`;

  const triggerProps = triggerRes.Properties;
  const httpMethods = triggerProps.Methods;
  const authType = triggerProps.AuthType;

  const codeUri = functionRes.Properties.CodeUri;
  const runtime = functionRes.Properties.Runtime;

  debug('debug port: %d', debugPort);

  if (debugPort && runtime === 'java8') {
    console.error(red('debug for java8 http trigger is not supported now. If you really need it, please create an issue to https://github.com/alibaba/funcraft/issues .'));
    return;
  }

  await fc.detectLibrary(codeUri, runtime, baseDir, functionName);
  const httpInvoke = new HttpInvoke(serviceName, serviceRes, functionName, functionRes, debugPort, debugIde, baseDir, authType, endpointPrefix);
  if (eager) {
    await httpInvoke.initAndStartRunner();
  }
  for (let method of httpMethods) {
    app[method.toLowerCase()](endpoint, async (req, res) => {
      if (req.get('Upgrade') === 'websocket') {
        res.status(403).send('websocket not support');
        return;
      }
      await httpInvoke.invoke(req, res);
    });
  }
  printHttpTriggerTips(serverPort, serviceName, functionName, triggerName, endpointPrefix, httpMethods, authType);
}

function logsApi(serverPort, serviceName, functionName, endpoint) {
  console.log(green(`api ${serviceName}/${functionName} was registered`));
  console.log('\turl: ' + yellow(`http://localhost:${serverPort}${endpoint}/`));
}

async function registerApis(app, serverPort, functions, debugPort, debugIde, baseDir) {
  for (let { serviceName, serviceRes,
    functionName, functionRes } of functions) {

    const endpoint = `/2016-08-15/services/${serviceName}/functions/${functionName}/invocations`;

    const apiInvoke = new ApiInvoke(serviceName, serviceRes, functionName, functionRes, debugPort, debugIde, baseDir);

    const codeUri = functionRes.Properties.CodeUri;
    const runtime = functionRes.Properties.Runtime;
    await fc.detectLibrary(codeUri, runtime, baseDir, functionName);

    app.post(endpoint, async (req, res) => {
      apiInvoke.invoke(req, res);
    });

    logsApi(serverPort, serviceName, functionName, endpoint);
  }

  console.log();
}

module.exports = {
  registerHttpTriggers, registerApis,
  registerSingleHttpTrigger
};
