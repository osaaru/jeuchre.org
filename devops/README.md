# jeuchre.org infrastructure AWS CDK project

This project is used to update and manage the AWS infrastructure used to host jeuchre.org
It uses a CDK pipeline that automatically deploys/updates the stack each time code is pushed.

## Prerequisites

- Node.js - 14 or later
- AWS CLI configured with a credentials for a profile named `jeuchre-org-admin` in `~/.aws/credentials`
- The `jeuchre-org-admin` profile should have `us-east-1` defined as the default region set in `~/.aws/config`

## One-time setup

1. The initial one-time setup requires the `jeuchre-org-admin` IAM user to have admin privileges. This is needed to bootstrap the CDK. The best way to do this is to assign a policy with full administrative privileges and revoke that policy after leaving the IAM user with only the privileges they need.

2. Follow https://docs.aws.amazon.com/cdk/latest/guide/cdk_pipeline.html to bootstrap the CDK environment for the `us-east-1` region using the administrator account. If you are using the same account for the pipeline as the deployment environments, then you can skip the bootstrap steps to assign trust between accounts.

3. Create a Route 53 Public Hosted Zone for the jeuchre.org domain. Although this can be done via CDK, I don't think its a good idea to have the DNS for the domain managed via CDK / Cloudformation. It also makes creating the initial ACM cert difficult because the registrar needs to be configured with the nameservers for the hosted zone before certificates can be auto-verified.

4. Edit the NS record with a TTL of 900

5. Configure the domain with the registrar to use the nameservers for the hosted zone.

6. Generate a Github personal access token to allow the CDK Pipeline to access the repo. To be safe, you should create a dedicated github account that only has access to the repo in question to issue the personal access token. Instructions for generating the access token: https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html.

7. Create a secret in the AWS Secrets Manager called `jeuchre/org`. Add a key named `github_access_token` with the access token as the value.

8. Perform the initial deployment using `yarn deploy`

Subsequent pushes to the repo will cause the pipeline to self-update.

## Environment variables

These can be set on the command line or in a .env file.

GITHUB_OWNER - can be used to override the github repo owner. Defaults to `osaaru`
GITHUB_REPO - can be used to override the github repo name. Defaults to `jeuchre.org`
HOSTED_ZONE_ID - the id of the hosted zone created as part of the one-time setup.
SECRET_NAME - can be used to override the name of secret used by this CDK app. Defaults to `jeuchre/org`

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
