import core = require("@aws-cdk/core")
import * as s3 from "@aws-cdk/aws-s3"
import { CfnOutput, Stack } from "@aws-cdk/core"

export class AppStack extends Stack {
  public readonly hostName: CfnOutput

  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super(scope, id, props)

    const hostName = `${id}.jeuchre.org`

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucket = new s3.Bucket(this, "CreateReactAppBucket", {
      bucketName: hostName,
    })

    this.hostName = new CfnOutput(this, "hostName", {
      value: hostName,
    })
  }
}
