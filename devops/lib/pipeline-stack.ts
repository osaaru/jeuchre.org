/* eslint-disable @typescript-eslint/no-unused-vars */
import { Artifact } from "@aws-cdk/aws-codepipeline"
import { GitHubSourceAction, GitHubTrigger } from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines"
import { config } from "dotenv"

import { AppStack } from "./app-stack"
import { ResourcesStack } from "./resources-stack"

config({ path: process.env.ENVFILE })

interface AppStageProps extends StageProps {
  resourcesStack: ResourcesStack
}

export class AppStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props)

    const { resourcesStack } = props

    this.appStack = new AppStack(this, id, {
      resourcesStack,
      // env has to be explicitly set in order for it to use HostedZone
      // env: {
      //   account: "220379026029", // TODO: How do we get this from pipeline env?
      //   region: "us-east-1", // Must be us-east-1 in order to create ACM certificates
      // },
      stackName: `jeuchre-org-${id}`,
    })
  }
}

interface PipelineStackProps extends StackProps {
  domainName: string
  resourcesStack: ResourcesStack
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    const { domainName, resourcesStack } = props

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

    const appStage = new AppStage(this, "master", { resourcesStack }) // TODO: Use branch name
    const appPipelineStage = pipeline.addApplicationStage(appStage)

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
