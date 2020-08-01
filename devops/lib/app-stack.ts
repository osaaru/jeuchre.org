/* eslint-disable @typescript-eslint/no-unused-vars */
import { Distribution } from "@aws-cdk/aws-cloudfront"
import { AaaaRecord, HostedZone, RecordTarget, IHostedZone } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core"

interface AppStackProps extends StackProps {
  distributionId: string
  domainName: string
  hostedZoneId: string
  zoneName: string
}

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { distributionId, domainName, hostedZoneId, zoneName } = props

    this.hostName = new CfnOutput(this, "hostName", {
      value: `${id}.${domainName}`,
    })

    // TODO: Origin behavior

    const distribution = Distribution.fromDistributionAttributes(this, "Distribution", {
      distributionId,
      domainName,
    })

    const zone = HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId,
      zoneName,
    })

    const dnsRecord = new AaaaRecord(this, "DnsRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    })
  }
}
