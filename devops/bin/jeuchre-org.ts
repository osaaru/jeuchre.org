/* eslint-disable @typescript-eslint/no-unused-vars */
import "source-map-support/register"

import { App } from "@aws-cdk/core"
import { config } from "dotenv"

import { PipelineStack } from "../lib/pipeline-stack"
import { ResourcesStack } from "../lib/resources-stack"

config({ path: process.env.ENVFILE })

const domainName = "jeuchre.org"

const app = new App()

const resourcesStack = new ResourcesStack(app, "jeuchre-org-resources", {
  domainName,
  // Forced to us-east-1 because certificate validation only works in us-east-1
  env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
})

const pipelineStack = new PipelineStack(app, "jeuchre-org-pipeline", {
  distributionId: resourcesStack.distributionId.value,
  domainName,
  env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  hostedZoneId: resourcesStack.hostedZoneId.value,
  zoneName: resourcesStack.hostedZoneName.value,
})
pipelineStack.addDependency(resourcesStack)

app.synth()
