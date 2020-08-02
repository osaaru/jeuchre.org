/* eslint-disable @typescript-eslint/no-unused-vars */
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import { Distribution, S3Origin, IDistribution } from "@aws-cdk/aws-cloudfront"
import { PublicHostedZone, IHostedZone } from "@aws-cdk/aws-route53"
import { Bucket } from "@aws-cdk/aws-s3"
import { CfnOutput, Construct, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core"

interface ResourcesStackProps extends StackProps {
  domainName: string
}

export class ResourcesStack extends Stack {
  public readonly distribution: IDistribution
  public readonly distributionId: CfnOutput
  public readonly distributionDomainName: CfnOutput
  public readonly hostedZone: IHostedZone
  public readonly hostedZoneId: CfnOutput

  constructor(scope: Construct, id: string, props: ResourcesStackProps) {
    super(scope, id, props)

    const { domainName } = props

    const bucket = new Bucket(this, "S3Bucket", {
      bucketName: domainName,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    /* Until we can get a reference to the distribution in the app stage stack...

    const hostedZoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    this.hostedZone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: hostedZoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    this.hostedZoneId = new CfnOutput(this, "hostedZoneId", {
      value: this.hostedZone.hostedZoneId,
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName: `*.${domainName}`,
      validation: CertificateValidation.fromDns(this.hostedZone),
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
    */
  }
}
