/* eslint-disable @typescript-eslint/no-unused-vars */
import core = require("@aws-cdk/core")
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import { CloudFrontWebDistribution, Distribution, S3Origin } from "@aws-cdk/aws-cloudfront"
import { PublicHostedZone } from "@aws-cdk/aws-route53"
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

    const hostedZone = PublicHostedZone.fromLookup(this, "HostedZone", { domainName })

    const certificate = new Certificate(this, "Certificate", {
      domainName: hostName,
      validation: CertificateValidation.fromDns(hostedZone),
    })

    const bucket = new Bucket(this, "S3Bucket", {
      bucketName: hostName,
    })

    const cloudfront = new Distribution(this, "CloudfrontDistribution", {
      certificate,
      defaultBehavior: { origin: new S3Origin({ bucket }) },
    })
  }
}
