/* eslint-disable @typescript-eslint/no-unused-vars */
import { Artifact } from "@aws-cdk/aws-codepipeline"
import { GitHubSourceAction, GitHubTrigger } from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines"
import { config } from "dotenv"

import { AppStack } from "./app-stack"

config({ path: process.env.ENVFILE })

interface PipelineStackProps extends StackProps {
  domainName: string
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: PipelineStackProps) {
    super(scope, id, props)

    const domainName = props?.domainName || ""

    const sourceArtifact = new Artifact()
    const cloudAssemblyArtifact = new Artifact()

    const pipeline = new CdkPipeline(this, "JeuchreOrgCodePipeline", {
      cloudAssemblyArtifact,
      pipelineName: "jeuchre-org",
      sourceAction: new GitHubSourceAction({
        actionName: "GitHub",
        oauthToken: SecretValue.secretsManager(process.env.SECRET_NAME || "jeuchre/org", {
          jsonField: "github_access_token",
        }),
        output: sourceArtifact,
        // Replace these with your actual GitHub project info
        owner: process.env.GITHUB_OWNER || "osaaru",
        repo: process.env.GITHUB_REPO || domainName,
        trigger: GitHubTrigger.POLL,
      }),

      synthAction: SimpleSynthAction.standardYarnSynth({
        buildCommand: "env && cd ../site && yarn build",
        cloudAssemblyArtifact,
        // copyEnvironmentVariables: ["HOSTED_ZONE_ID"],
        sourceArtifact,
        subdirectory: "devops", // Need to set this to where the CDK app is
      }),
    })

    // const buildStage = new JeuchreOrgStage(this, "app-build")
    //   const masterApplicationStage = pipeline.addApplicationStage(masterStage)

    //   const validateAction = new ShellScriptAction({
    //     actionName: "validate",
    //     additionalArtifacts: [sourceArtifact],
    //     commands: ["ls"],
    //     useOutputs: {
    //       URL: pipeline.stackOutput(masterStage.appStack.hostName),
    //     },
    //   })
    //   masterApplicationStage.addActions(validateAction)

    //   const buildAction = new ShellScriptAction({
    //     actionName: "build",
    //     commands: ["yarn build"],
    //     useOutputs: {
    //       URL: pipeline.stackOutput(masterStage.appStack.hostName),
    //     },
    //   })
    //   masterApplicationStage.addActions(buildAction)
  }
}
