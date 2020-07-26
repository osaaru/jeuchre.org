# jeuchre.org infrastructure AWS CDK project

This project is used to update and manage the AWS infrastructure used to host jeuchre.org
It uses a CDK pipeline that automatically deploys/updates the stack each time code is pushed.

## Prerequisites

- Node.js - 14 or later
- AWS CLI configured with a credentials profile named `jeuchre-org-admin` in `~/.aws/credentials`
- The `jeuchre-org-admin` should have a default region set in `~/.aws/config`
-

## One-time setup

The initial one-time setup requires IAM credentials for an account with admin privileges for an AWS account. This is needed to setup the CDK pipeline.

Follow https://docs.aws.amazon.com/cdk/latest/guide/cdk_pipeline.html
If you are using the same account for the pipeline as the deployment environments, then you can skip the bootstrap steps to assign trust between accounts.

Boostrap the account for CDK use
`CDK_NEW_BOOTSTRAP=1 npx cdk bootstrap --profile account_admin --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess`?

Configure `GITHUB_OWNER` and `GITHUB_REPO` in a `.env` file.
The repo owner must issue a personal access token to be used by the CodePipeline. Create a plain text Secrets Manager secret called `/jeuchre/org/github_access_token`. If you want to use a different name configure `GITHUB_ACCESS_TOKEN_SECRET_NAME` in `.env`.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
