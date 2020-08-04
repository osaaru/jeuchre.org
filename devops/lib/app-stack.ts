/* eslint-disable @typescript-eslint/no-unused-vars */
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import {
  CloudFrontWebDistribution,
  HttpVersion,
  OriginAccessIdentity,
  SSLMethod,
  SecurityPolicyProtocol,
} from "@aws-cdk/aws-cloudfront"
import { S3Origin } from "@aws-cdk/aws-cloudfront-origins"
import { ARecord, PublicHostedZone, RecordTarget } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { Bucket } from "@aws-cdk/aws-s3"
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment"
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core"

interface AppStackProps extends StackProps {
  distributionDomainName?: string
  distributionId?: string
  domainName: string
}

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { distributionDomainName, distributionId, domainName } = props

    const hostName = `${id}.${domainName}`

    this.hostName = new CfnOutput(this, "hostName", {
      value: hostName,
    })

    const zoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: zoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    /* Once we're able to do this...
    const distribution = Distribution.fromDistributionAttributes(this, "Distribution", {
      distributionId,
      domainName: distributionDomainName,
    })
*/

    const bucket = Bucket.fromBucketName(this, "Bucket", domainName)

    const certificate = new Certificate(this, "Certificate", {
      domainName: hostName,
      validation: CertificateValidation.fromDns(zone),
    })

    // TODO: The new hotness is Distribution but it doesn't seem to update the bucket policy for the OAI yet
    const originAccessIdentity = new OriginAccessIdentity(this, "OriginAccessIdentity", { comment: hostName })
    bucket.grantRead(originAccessIdentity)
    const distribution = new CloudFrontWebDistribution(this, "CloudfrontDistribution", {
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [hostName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      comment: hostName,
      defaultRootObject: "index.html",
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: { originAccessIdentity, originPath: "/master", s3BucketSource: bucket },
        },
      ],
    })

    const dnsRecord = new ARecord(this, "DnsRecord", {
      recordName: hostName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    })

    const bucketDeployment = new BucketDeployment(this, "DeployWithInvalidation", {
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
      sources: [Source.asset("../site/public")],
    })
  }
}
