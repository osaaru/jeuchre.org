/* eslint-disable @typescript-eslint/no-unused-vars */
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import {
  CloudFrontWebDistribution,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  SSLMethod,
  SecurityPolicyProtocol,
} from "@aws-cdk/aws-cloudfront"
import { S3Origin } from "@aws-cdk/aws-cloudfront-origins"
import { ARecord, PublicHostedZone, RecordTarget } from "@aws-cdk/aws-route53"
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets"
import { Bucket } from "@aws-cdk/aws-s3"
import { BucketDeployment, CacheControl, Source } from "@aws-cdk/aws-s3-deployment"
import { CfnOutput, Construct, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core"

interface AppStackProps extends StackProps {
  branchName: string
  distributionDomainName?: string
  distributionId?: string
  domainName: string
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { branchName, domainName } = props
    const hostName = `${branchName === "prod" ? "www" : branchName}.${domainName}`

    const zoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: zoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    const bucket = new Bucket(this, "S3Bucket", {
      bucketName: hostName,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName: hostName,
      validation: CertificateValidation.fromDns(zone),
    })

    // TODO: The new hotness is Distribution but it doesn't appear to be complete yet
    // const distribution = new Distribution(this, "Distribution", {
    //   certificate,
    //   defaultBehavior: { origin: new S3Origin(bucket) },
    // })

    const originAccessIdentity = new OriginAccessIdentity(this, "OriginAccessIdentity", { comment: hostName })
    bucket.grantRead(originAccessIdentity)
    const distribution = new CloudFrontWebDistribution(this, "CloudfrontWebDistribution", {
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [hostName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      comment: hostName,
      defaultRootObject: "index.html",
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/404.html",
        },
      ],
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: { originAccessIdentity, s3BucketSource: bucket },
        },
      ],
    })

    const dnsRecord = new ARecord(this, "DnsRecord", {
      recordName: hostName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    })

    const notHtmlBucketDeployment = new BucketDeployment(this, "DeployNonHtml", {
      cacheControl: [CacheControl.fromString("max-age=31536000,public,immutable")],
      destinationBucket: bucket,
      distribution,
      sources: [Source.asset("../site/public", { exclude: ["**/*.html"] })],
    })

    const htmlBucketDeployment = new BucketDeployment(this, "DeployHtml", {
      cacheControl: [CacheControl.fromString("max-age=0,no-cache,no-store,must-revalidate")],
      destinationBucket: bucket,
      distribution,
      sources: [Source.asset("../site/public", { exclude: ["**", "!**/*.html"] })],
    })
  }
}
