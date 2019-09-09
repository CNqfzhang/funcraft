'use strict';

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { deployByRos } = require('../../lib/deploy/deploy-support-ros');
const client = require('../../lib/client');
const { setProcess } = require('../test-utils');
const assert = sandbox.assert;
const uuid = require('uuid');

describe('test deploy support ros', () => {

  let rosClient;
  const stackName = 'stackName';

  const requestOption = {
    method: 'POST'
  };

  let requestStub;
  let restoreProcess;

  beforeEach(() => {

    restoreProcess = setProcess({
      ACCOUNT_ID: 'testAccountId',
      ACCESS_KEY_ID: 'testKeyId',
      ACCESS_KEY_SECRET: 'testKeySecret',
      FC_ENDPOINT: 'test fc endpoint',
      REGION: 'cn-beijing'
    });

    requestStub = sandbox.stub();

    rosClient = {
      request: requestStub
    };

    sandbox.stub(client, 'getRosClient').resolves(rosClient);
    sandbox.stub(uuid, 'v4').returns('random');
  });

  afterEach(() => {
    restoreProcess();
    sandbox.restore();
  });

  it('test deploy by ros', async () => {
    const tpl = {};
    const stackId = 'c2234cf3-40f1-440f-b634-51370180589a';

    const listParams = {
      'RegionId': 'cn-beijing',
      'StackName.1': stackName,
      'PageSize': 50,
      'PageNumber': 1,
      'ShowNestedStack': false
    };

    requestStub.withArgs('ListStacks', listParams, requestOption).resolves({
      'PageNumber': 1,
      'TotalCount': 3,
      'PageSize': 50,
      'Stacks': [
        {
          'StackId': stackId,
          'StackName': stackName
        }
      ]
    });

    const updateParams = {
      RegionId: 'cn-beijing',
      ChangeSetName: 'fun-random',
      StackId: stackId,
      ChangeSetType: 'UPDATE',
      Description: 'generate by fun',
      TemplateBody: '{}',
      DisableRollback: false,
      TimeoutInMinutes: 10
    };

    requestStub.withArgs('CreateChangeSet', updateParams, requestOption).resolves({
      ChangeSetId: 'changeSetId'
    });

    const execChangeSetParams = {
      RegionId: 'cn-beijing', 
      ChangeSetId: 'changeSetId'
    };

    requestStub.withArgs('ExecuteChangeSet', execChangeSetParams, requestOption).resolves();

    await deployByRos(stackName, tpl);

    assert.calledWith(requestStub.firstCall, 'ListStacks', listParams, requestOption);
    assert.calledWith(requestStub.secondCall, 'CreateChangeSet', updateParams, requestOption);
    assert.calledWith(requestStub.thirdCall, 'ExecuteChangeSet', execChangeSetParams, requestOption);
  });
});