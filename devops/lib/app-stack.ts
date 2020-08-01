/* eslint-disable @typescript-eslint/no-unused-vars */
import { AaaaRecord, RecordTarget } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core"

import { ResourcesStack } from "./resources-stack"

const domainName = "jeuchre.org"

interface AppStackProps extends StackProps {
  resourcesStack: ResourcesStack
}

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { resourcesStack } = props

    this.hostName = new CfnOutput(this, "hostName", {
      value: `${id}.${domainName}`,
    })

    // TODO: Origin behavior

    const dnsRecord = new AaaaRecord(this, "DnsRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(resourcesStack.distribution)),
      zone: resourcesStack.hostedZone,
    })
  }
}
