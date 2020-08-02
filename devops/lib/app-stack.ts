/* eslint-disable @typescript-eslint/no-unused-vars */
import { Distribution } from "@aws-cdk/aws-cloudfront"
import { ARecord, PublicHostedZone, RecordTarget, IHostedZone } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core"

interface AppStackProps extends StackProps {
  distributionDomainName: string
  distributionId: string
  domainName: string
}

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { distributionDomainName, distributionId, domainName } = props

    this.hostName = new CfnOutput(this, "hostName", {
      value: `${id}.${domainName}`,
    })

    // TODO: Origin behavior

    const distribution = Distribution.fromDistributionAttributes(this, "Distribution", {
      distributionId,
      domainName: distributionDomainName,
    })

    const zoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: zoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    const dnsRecord = new ARecord(this, "DnsRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    })
  }
}
