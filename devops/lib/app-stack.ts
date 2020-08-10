/* eslint-disable @typescript-eslint/no-unused-vars */
import { Certificate, CertificateValidation } from "@aws-cdk/aws-certificatemanager"
import {
  CloudFrontWebDistribution,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  SSLMethod,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
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
  prodHostName: string
  stagingHostName: string
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { branchName, domainName, prodHostName, stagingHostName } = props

    const zoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: zoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    const prodBucket = new Bucket(this, "ProdBucket", {
      bucketName: prodHostName,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteErrorDocument: "404.html",
      websiteIndexDocument: "index.html",
    })

    const stagingBucket = new Bucket(this, "StagingBucket", {
      bucketName: stagingHostName,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const prodCertificate = new Certificate(this, "ProdCertificate", {
      domainName: prodHostName,
      validation: CertificateValidation.fromDns(zone),
    })

    const stagingCertificate = new Certificate(this, "StagingCertificate", {
      domainName: stagingHostName,
      validation: CertificateValidation.fromDns(zone),
    })

    // TODO: The new hotness is Distribution but it doesn't appear to be complete yet
    /*
    const prodDistribution = new Distribution(this, "ProdDistribution", {
      certificate: prodCertificate,
      defaultBehavior: {
        compress: true,
        origin: new S3Origin(prodBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    })

    const stagingDistribution = new Distribution(this, "StagingDistribution", {
      certificate: stagingCertificate,
      defaultBehavior: {
        compress: true,
        origin: new S3Origin(stagingBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [{ httpStatus: 403, responseHttpStatus: 404, responsePagePath: "/404.html" }],
    })
*/

    const prodDistribution = new CloudFrontWebDistribution(this, "ProductionWebDistribution", {
      aliasConfiguration: {
        acmCertRef: prodCertificate.certificateArn,
        names: [prodHostName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      comment: prodHostName,
      defaultRootObject: "index.html",
      errorConfigurations: [
        // {
        //   errorCode: 403,
        //   responseCode: 404,
        //   responsePagePath: "/404.html",
        // },
      ],
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: { s3BucketSource: prodBucket },
        },
      ],
    })

    const stagingOriginAccessIdentity = new OriginAccessIdentity(this, "StagingOriginAccessIdentity", {
      comment: stagingHostName,
    })
    stagingBucket.grantRead(stagingOriginAccessIdentity)
    const stagingDistribution = new CloudFrontWebDistribution(this, "StagingWebDistribution", {
      aliasConfiguration: {
        acmCertRef: stagingCertificate.certificateArn,
        names: [stagingHostName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      comment: stagingHostName,
      defaultRootObject: "index.html",
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 404,
          responsePagePath: "/404.html",
        },
      ],
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: { originAccessIdentity: stagingOriginAccessIdentity, s3BucketSource: stagingBucket },
        },
      ],
    })

    const prodDnsRecord = new ARecord(this, "ProdDnsRecord", {
      recordName: prodHostName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(prodDistribution)),
      zone,
    })

    const stagingDnsRecord = new ARecord(this, "StagingDnsRecord", {
      recordName: stagingHostName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(stagingDistribution)),
      zone,
    })

    const prodNotHtmlBucketDeployment = new BucketDeployment(this, "ProdNotHtmlDeployment", {
      cacheControl: [CacheControl.fromString("max-age=31536000,public,immutable")],
      destinationBucket: prodBucket,
      sources: [Source.asset("../site/public", { exclude: ["**/*.html"] })],
    })

    const prodHtmlBucketDeployment = new BucketDeployment(this, "ProdHtmlDeployment", {
      cacheControl: [CacheControl.fromString("max-age=0,no-cache,no-store,must-revalidate")],
      destinationBucket: prodBucket,
      distribution: prodDistribution,
      distributionPaths: ["*"],
      sources: [Source.asset("../site/public", { exclude: ["*", "!**/*.html"] })],
    })

    const stagingNotHtmlBucketDeployment = new BucketDeployment(this, "StagingNotHtmlDeployment", {
      cacheControl: [CacheControl.fromString("max-age=31536000,public,immutable")],
      destinationBucket: stagingBucket,
      sources: [Source.asset("../site/public", { exclude: ["**/*.html"] })],
    })

    const stagingHtmlBucketDeployment = new BucketDeployment(this, "StagingHtmlDeployment", {
      cacheControl: [CacheControl.fromString("max-age=0,no-cache,no-store,must-revalidate")],
      destinationBucket: stagingBucket,
      distribution: stagingDistribution,
      distributionPaths: ["*"],
      sources: [Source.asset("../site/public", { exclude: ["*", "!**/*.html"] })],
    })
  }
}
