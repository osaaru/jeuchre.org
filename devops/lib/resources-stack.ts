/* eslint-disable @typescript-eslint/no-unused-vars */
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import { Distribution, S3Origin } from "@aws-cdk/aws-cloudfront"
import { PublicHostedZone, IHostedZone } from "@aws-cdk/aws-route53"
import { Bucket } from "@aws-cdk/aws-s3"
import { CfnOutput, Construct, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core"

interface ResourcesStackProps extends StackProps {
  domainName: string
}

export class ResourcesStack extends Stack {
  public readonly distribution: Distribution
  public readonly distributionId: CfnOutput
  public readonly distributionDomainName: CfnOutput
  public readonly hostedZone: IHostedZone
  public readonly hostedZoneId: CfnOutput
  public readonly hostedZoneName: CfnOutput

  constructor(scope: Construct, id: string, props: ResourcesStackProps) {
    super(scope, id, props)

    const { domainName } = props

    const hostedZoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    this.hostedZone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: hostedZoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    this.hostedZoneId = new CfnOutput(this, "hostedZoneId", {
      value: this.hostedZone.hostedZoneId,
    })

    this.hostedZoneName = new CfnOutput(this, "hostedZoneName", {
      value: this.hostedZone.zoneName,
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName: `*.${domainName}`,
      validation: CertificateValidation.fromDns(this.hostedZone),
    })

    const bucket = new Bucket(this, "S3Bucket", {
      bucketName: domainName,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.distribution = new Distribution(this, "CloudfrontDistribution", {
      certificate,
      defaultBehavior: { origin: new S3Origin({ bucket, originPath: "www" }) },
    })

    this.distributionId = new CfnOutput(this, "distributionId", {
      value: this.distribution.distributionId,
    })

    this.distributionDomainName = new CfnOutput(this, "distributionDomainName", {
      value: this.distribution.domainName,
    })
  }
}
