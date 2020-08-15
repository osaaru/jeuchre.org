/* eslint-disable @typescript-eslint/no-unused-vars */
import "source-map-support/register"

import { App } from "@aws-cdk/core"
import { config } from "dotenv"

import { PipelineStack } from "../lib/pipeline-stack"
import { ResourcesStack } from "../lib/resources-stack"

config({ path: process.env.ENVFILE })

const domainName = "jeuchre.org"
const prodHostName = "www.jeuchre.org"

const app = new App()

const resourcesStack = new ResourcesStack(app, "jeuchre-org-resources", {
  domainName,
  // Forced to us-east-1 because certificate validation only works in us-east-1
  env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  prodHostName,
})

const nextPipelineStack = new PipelineStack(app, "jeuchre-org-pipeline-next", {
  branchName: "prod",
  deploymentName: "next",
  domainName,
  env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  hostName: "next.jeuchre.org",
  resourcesStack,
})
nextPipelineStack.addDependency(resourcesStack)

const prodPipelineStack = new PipelineStack(app, "jeuchre-org-pipeline-prod", {
  branchName: "prod",
  deploymentName: "prod",
  domainName,
  env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  hostName: prodHostName,
  resourcesStack,
})
prodPipelineStack.addDependency(resourcesStack)

app.synth()
