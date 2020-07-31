/* eslint-disable @typescript-eslint/no-unused-vars */
import { Distribution, S3Origin } from "@aws-cdk/aws-cloudfront"
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

    const hostName = `${id}.${domainName}`

    this.hostName = new CfnOutput(this, "hostName", {
      value: hostName,
    })

    // TODO: Origin behavior

    // DNS record
    const dnsRecord = new AaaaRecord(this, "DnsRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(resourcesStack.distribution)),
      zone: resourcesStack.hostedZone,
    })
  }
}
