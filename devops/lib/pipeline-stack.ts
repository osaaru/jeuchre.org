/* eslint-disable @typescript-eslint/no-unused-vars */
import { Artifact } from "@aws-cdk/aws-codepipeline"
import { GitHubSourceAction, GitHubTrigger } from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines"

import { AppStack } from "./app-stack"
import { ResourcesStack } from "./resources-stack"

interface AppStageProps extends StageProps {
  distributionDomainName?: string
  distributionId?: string
  domainName: string
}

export class AppStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props)

    const { distributionDomainName, distributionId, domainName } = props

    this.appStack = new AppStack(this, id, {
      distributionDomainName,
      distributionId,
      domainName,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
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

    const sourceArtifact = new Artifact("source")
    const appBuildArtifact = new Artifact("appBuild")
    const cloudAssemblyArtifact = new Artifact("cloudAssembly")

    const sourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      oauthToken: SecretValue.secretsManager(process.env.SECRET_NAME || "jeuchre/org", {
        jsonField: "github_access_token",
      }),
      output: sourceArtifact,
      // Replace these with your actual GitHub project info
      owner: process.env.GITHUB_OWNER || "osaaru",
      repo: process.env.GITHUB_REPO || domainName,
      trigger: GitHubTrigger.POLL,
    })

    const environmentVariables = {
      BRANCH_NAME: { value: sourceAction.variables.branchName },
      DOMAIN_NAME: { value: domainName },
    }

    const pipeline = new CdkPipeline(this, "JeuchreOrgCodePipeline", {
      cloudAssemblyArtifact,
      pipelineName: "jeuchre-org",
      sourceAction,
      synthAction: SimpleSynthAction.standardYarnSynth({
        additionalArtifacts: [{ artifact: appBuildArtifact, directory: "../site/public" }],
        buildCommand: "APP_HOST_NAME=$BRANCH_NAME.$DOMAIN_NAME env && cd .. && yarn build && cd devops",
        cloudAssemblyArtifact,
        environmentVariables,
        // copyEnvironmentVariables: ["HOSTED_ZONE_ID"],
        sourceArtifact,
        subdirectory: "devops", // Need to set this to where the CDK app is
      }),
    })

    const appStage = new AppStage(this, "master", {
      // distributionDomainName: resourcesStack.distributionDomainName.value,
      // distributionId: resourcesStack.distributionId.value,
      domainName,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
    }) // TODO: Use branch name
    const appPipelineStage = pipeline.addApplicationStage(appStage)

    // const buildAction = new ShellScriptAction({
    //   actionName: "appBuild",
    //   additionalArtifacts: [sourceArtifact],
    //   commands: ["env", "yarn", "cd site", "yarn build"],
    // })
    // appPipelineStage.addActions(buildAction)

    // const deployAction = new ShellScriptAction({
    //   actionName: "appDeploy",
    //   additionalArtifacts: [appBuildArtifact],
    //   commands: ["env", "yarn", "cd site", "yarn build"],
    // })
    // appPipelineStage.addActions(buildAction)

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
