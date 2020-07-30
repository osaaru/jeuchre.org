/* eslint-disable @typescript-eslint/no-unused-vars */
import core = require("@aws-cdk/core")
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import { Distribution, S3Origin } from "@aws-cdk/aws-cloudfront"
import { AaaaRecord, PublicHostedZone, RecordTarget } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { Bucket } from "@aws-cdk/aws-s3"
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core"

const domainName = "jeuchre.org"

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const hostName = `${id}.${domainName}`

    this.hostName = new CfnOutput(this, "hostName", {
      value: hostName,
    })

    // Note: I tried a couple of the other HZ lookup methods but they had problems. This is the only one that seems to work.
    // fromLookup is a PITA because it needs the stack to have an explicit environment which backs up to the pipeline too
    // fromHostedZoneId and fromHostedZoneName return proxies that are incomplete and don't respond to some of the methods
    // used by downstream constructs
    const hostedZone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: process.env.HOSTED_ZONE_ID || "",
      zoneName: domainName,
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName: hostName,
      validation: CertificateValidation.fromDns(hostedZone),
    })

    const bucket = new Bucket(this, "S3Bucket", {
      bucketName: hostName,
    })

    const distribution = new Distribution(this, "CloudfrontDistribution", {
      certificate,
      defaultBehavior: { origin: new S3Origin({ bucket }) },
    })

    const dnsRecord = new AaaaRecord(this, "DnsRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone,
    })
  }
}
