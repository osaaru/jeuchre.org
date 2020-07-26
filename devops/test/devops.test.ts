import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Devops = require('../lib/devops-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Devops.DevopsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});