import "source-map-support/register"

import { App } from "@aws-cdk/core"
import { PipelineStack } from "../lib/pipeline-stack"

const app = new App()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pipeline = new PipelineStack(app, "jeuchre-org-pipeline")

app.synth()
