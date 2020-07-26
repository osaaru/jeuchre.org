#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { DevopsStack } from '../lib/devops-stack';

const app = new cdk.App();
new DevopsStack(app, 'DevopsStack');
