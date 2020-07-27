import * as codepipeline from "@aws-cdk/aws-codepipeline"
import * as codepipelineActions from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines"
import { config } from "dotenv"

import { AppStack } from "./app-stack"

config({ path: process.env.ENVFILE })

export class JeuchreOrgStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

    this.appStack = new AppStack(this, id, {
      stackName: `jeuchre-org-${id}`,
    })
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact()

    const pipeline = new CdkPipeline(this, "JeuchreOrgCodePipeline", {
      cloudAssemblyArtifact,
      pipelineName: "jeuchre-org",
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
        // buildCommand: "yarn build",
        cloudAssemblyArtifact,
        sourceArtifact,
        subdirectory: "devops",
      }),
    })

    const masterStage = new JeuchreOrgStage(this, "master")
    const masterApplicationStage = pipeline.addApplicationStage(masterStage)

    const validateAction = new ShellScriptAction({
      actionName: "validate",
      commands: ["yarn lint"],
      useOutputs: {
        URL: pipeline.stackOutput(masterStage.appStack.hostName),
      },
    })
    masterApplicationStage.addActions(validateAction)

    const buildAction = new ShellScriptAction({
      actionName: "build",
      commands: ["yarn build"],

      useOutputs: {
        URL: pipeline.stackOutput(masterStage.appStack.hostName),
      },
    })
    masterApplicationStage.addActions(buildAction)
  }
}
