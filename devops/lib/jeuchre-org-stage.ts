import core = require("@aws-cdk/core")
import * as s3 from "@aws-cdk/aws-s3"

export class JeuchreOrgStage extends core.Stage {
  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super(scope, id, props)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucket = new s3.Bucket(this, "CreateReactAppBucket", {
      bucketName: `${id}.jeuchre.org`,
    })
  }
}
