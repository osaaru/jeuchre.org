import * as cdk from "@aws-cdk/core"
import "source-map-support/register"

import { PipelineStack } from "../lib/pipeline-stack"

const app = new cdk.App()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pipeline = new PipelineStack(app, "jeuchre-org-pipeline")

app.synth()
