/* eslint-disable @typescript-eslint/no-unused-vars */
import { Artifact } from "@aws-cdk/aws-codepipeline"
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger } from "@aws-cdk/aws-codepipeline-actions"
import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines"

import { AppStack } from "./app-stack"
import { ResourcesStack } from "./resources-stack"

interface AppBuildStageProps extends StageProps {
  hostName: string
}

export class AppBuildStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props: AppBuildStageProps) {
    super(scope, id, props)
  }
}

interface AppDeployStageProps extends StageProps {
  branchName: string
  distributionDomainName?: string
  distributionId?: string
  domainName: string
  prodHostName: string
  stagingHostName: string
}

export class AppDeployStage extends Stage {
  public readonly appStack: AppStack

  constructor(scope: Construct, id: string, props: AppDeployStageProps) {
    super(scope, id, props)

    const { branchName, distributionDomainName, distributionId, domainName, prodHostName, stagingHostName } = props

    this.appStack = new AppStack(this, id, {
      branchName,
      distributionDomainName,
      distributionId,
      domainName,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
      prodHostName,
      stackName: `jeuchre-org-${id}`,
      stagingHostName,
    })
  }
}

interface PipelineStackProps extends StackProps {
  domainName: string
  prodHostName: string
  resourcesStack: ResourcesStack
  stagingHostName: string
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    const { domainName, prodHostName, stagingHostName } = props

    const sourceArtifact = new Artifact("source")
    const appBuildArtifact = new Artifact("appBuild")
    const cloudAssemblyArtifact = new Artifact("cloudAssembly")
    const branchName = "prod"

    const sourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      branch: branchName,
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
      // APP_HOST_NAME: { value: `${sourceAction.variables.branchName}.${domainName}` },
      BRANCH_NAME: { value: sourceAction.variables.branchName },
      DOMAIN_NAME: { value: domainName },
    }

    const pipeline = new CdkPipeline(this, "JeuchreOrgCodePipeline", {
      cloudAssemblyArtifact,
      pipelineName: "jeuchre-org",
      sourceAction,
      synthAction: SimpleSynthAction.standardYarnSynth({
        additionalArtifacts: [{ artifact: appBuildArtifact, directory: "../site/public" }],
        buildCommand: "env && echo $BRANCH_NAME && cd .. && yarn build && ls site/public && && cd devops", // If we don't cd back to devops, the synth command fails
        cloudAssemblyArtifact,
        environmentVariables,
        // copyEnvironmentVariables: ["HOSTED_ZONE_ID"],
        sourceArtifact,
        subdirectory: "devops", // Need to set this to where the CDK app is
      }),
    })

    const nextBuildStage = new AppBuildStage(this, "app-build-next", {
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
      hostName: prodHostName,
    })
    const nextBuildPipelineStage = pipeline.addApplicationStage(nextBuildStage)
    nextBuildPipelineStage.addActions(
      new ShellScriptAction({
        actionName: "build-next",
        additionalArtifacts: [sourceArtifact],
        commands: ["env", "ls"],
      }),
    )

    /*
    const appStage = new AppStage(this, "deploy", {
      branchName,
      // distributionDomainName: resourcesStack.distributionDomainName.value,
      // distributionId: resourcesStack.distributionId.value,
      domainName,
      env: { account: process.env.APP_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
      prodHostName,
      stagingHostName,
    }) // TODO: Use branch name
    const appPipelineStage = pipeline.addApplicationStage(appStage)
*/

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
