/* eslint-disable @typescript-eslint/no-unused-vars */
import { Artifact } from "@aws-cdk/aws-codepipeline"
import { GitHubSourceAction, GitHubTrigger } from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines"

import { AppStack } from "./app-stack"
import { ResourcesStack } from "./resources-stack"

interface AppDeployStageProps extends StageProps {
  branchName: string
  domainName: string
  hostName: string
}

export class AppDeployStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props: AppDeployStageProps) {
    super(scope, id, props)

    this.appStack = new AppStack(this, id, {
      ...props,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
      stackName: `jeuchre-org-${props.branchName}`,
    })
  }
}

interface PipelineStackProps extends StackProps {
  branchName: string
  domainName: string
  resourcesStack: ResourcesStack
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    const { branchName, domainName, resourcesStack } = props
    const hostName = `${branchName}.${domainName}`

    const sourceArtifact = new Artifact("source")
    const appBuildArtifact = new Artifact("appBuild")
    const cloudAssemblyArtifact = new Artifact("cloudAssembly")

    const sourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      branch: branchName,
      oauthToken: SecretValue.secretsManager(process.env.SECRET_NAME || "jeuchre/org", {
        jsonField: "github_access_token",
      }),
      output: sourceArtifact,
      owner: process.env.GITHUB_OWNER || "osaaru",
      repo: process.env.GITHUB_REPO || domainName,
      trigger: GitHubTrigger.POLL,
    })

    const environmentVariables = {
      APP_HOST_NAME: { value: hostName },
      BRANCH_NAME: { value: branchName },
      DOMAIN_NAME: { value: domainName },
    }

    const pipeline = new CdkPipeline(this, `JeuchreOrgCodePipeline-${branchName}`, {
      cloudAssemblyArtifact,
      pipelineName: `jeuchre-org-${branchName}`,
      sourceAction,
      synthAction: SimpleSynthAction.standardYarnSynth({
        additionalArtifacts: [{ artifact: appBuildArtifact, directory: "../site/public" }],
        buildCommand: "env && cd .. && yarn build && cd devops", // If we don't cd back to devops, the synth command fails
        cloudAssemblyArtifact,
        environmentVariables,
        sourceArtifact,
        subdirectory: "devops", // Need to set this to where the CDK app is
      }),
    })

    const appDeployStage = new AppDeployStage(this, "deploy", {
      branchName,
      domainName,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
      hostName,
    })
    const appPipelineStage = pipeline.addApplicationStage(appDeployStage)
  }
}
