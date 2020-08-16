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
  deploymentName: string
  domainName: string
  hostName: string
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const { deploymentName, domainName, hostName } = props

    const zoneProxy = PublicHostedZone.fromLookup(this, "HostedZoneProxy", { domainName })

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: zoneProxy.hostedZoneId,
      zoneName: domainName,
    })

    const bucket = new Bucket(this, "Bucket", {
      bucketName: hostName,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteErrorDocument: "404.html",
      websiteIndexDocument: "index.html",
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName: hostName,
      validation: CertificateValidation.fromDns(zone),
    })

    // TODO: The new hotness is Distribution but it doesn't support CNAME aliases yet https://github.com/aws/aws-cdk/issues/9430
    // const distribution = new Distribution(this, "Distribution", {
    //   certificate: certificate,
    //   comment: hostName,
    //   defaultBehavior: {
    //     compress: true,
    //     origin: new S3Origin(bucket),
    //     viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   },
    // })

    const distribution = new CloudFrontWebDistribution(this, "CloudFrontWebDistribution", {
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [hostName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      comment: hostName,
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: { s3BucketSource: bucket },
        },
      ],
    })

    /*
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
*/
    const dnsRecord = new ARecord(this, "DnsRecord", {
      recordName: hostName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    })

    // Deployments run in parallel
    // This strategy does not work - doesn't deploy any folders with a lone html file
    const notHtmlBucketDeployment = new BucketDeployment(this, "NotHtmlBucketDeployment", {
      cacheControl: [CacheControl.fromString("max-age=31536000,public,immutable")],
      destinationBucket: bucket,
      prune: false,
      sources: [Source.asset("../site/public", { exclude: ["**/*.html"] })],
    })

    const htmlBucketDeployment = new BucketDeployment(this, "HtmlBucketDeployment", {
      cacheControl: [CacheControl.fromString("max-age=0,no-cache,no-store,must-revalidate")],
      destinationBucket: bucket,
      prune: false,
      sources: [Source.asset("../site/public", { exclude: ["**", "!**/*.html"] })],
    })

    // Sigh. Just invalidate everything
    //   const bucketDeployment = new BucketDeployment(this, "BucketDeployment", {
    //     cacheControl: [CacheControl.fromString("max-age=31536000,public,immutable")],
    //     destinationBucket: bucket,
    //     distribution: distribution,
    //     distributionPaths: ["/*"],
    //     prune: false,
    //     sources: [Source.asset("../site/public")],
    //   })
  }
}
