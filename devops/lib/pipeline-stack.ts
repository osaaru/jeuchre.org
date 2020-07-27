import * as codepipeline from "@aws-cdk/aws-codepipeline"
import * as codepipelineActions from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core"
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines"
import { config } from "dotenv"

import { JeuchreOrgStage } from "./jeuchre-org-stage"

config({ path: process.env.ENVFILE })

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact()

    const pipeline = new CdkPipeline(this, "JeuchreOrgCodePipeline", {
      cloudAssemblyArtifact,
      pipelineName: "JeuchreOrgCodePipeline",
      sourceAction: new codepipelineActions.GitHubSourceAction({
        actionName: "GitHub",
        oauthToken: SecretValue.secretsManager(
          process.env.GITHUB_ACCESS_TOKEN_SECRET_NAME || "jeuchre/org/github_access_token",
        ),
        output: sourceArtifact,
        // Replace these with your actual GitHub project info
        owner: process.env.GITHUB_OWNER || "",
        repo: process.env.GITHUB_REPO || "",
        trigger: codepipelineActions.GitHubTrigger.POLL,
      }),

      synthAction: SimpleSynthAction.standardYarnSynth({
        cloudAssemblyArtifact,
        sourceArtifact,
      }),
    })

    const masterStage = pipeline.addApplicationStage(new JeuchreOrgStage(this, "master"))

    masterStage.addActions(
      new ShellScriptAction({
        actionName: "shell test",
        commands: ["yarn lint"],
      }),
    )
  }
}
