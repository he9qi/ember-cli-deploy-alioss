# ember-cli-deploy-alioss

> An ember-cli-deploy [plugin][1] to upload files to Aliyun OSS （阿里云对象储存）.  

[![Build Status](https://travis-ci.org/he9qi/ember-cli-deploy-alioss.svg?branch=master)](https://travis-ci.org/he9qi/ember-cli-deploy-alioss)
![](https://camo.githubusercontent.com/d65a04992412d3a15584f0d302a69df2749176c7/68747470733a2f2f656d6265722d636c692d6465706c6f792e6769746875622e696f2f656d6265722d636c692d6465706c6f792d76657273696f6e2d6261646765732f706c7567696e732f656d6265722d636c692d6465706c6f792d73332e737667)

This plugin is originally a fork from [ember-cli-deploy-s3][5] to setup Aliyun OSS.

## Quick Start

To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][2] is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-alioss
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV.alioss = {
  accessKeyId: '<your-oss-access-key>',
  secretAccessKey: '<your-oss-secret>',
  bucket: '<your-oss-bucket>',
  region: '<the-region-your-oss-bucket-is-in>'
}
```

- Run the pipeline

```bash
$ ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `configure`
- `upload`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

### accessKeyId (`required`)

The AWS access key for the user that has the ability to upload to the `bucket`.

*Default:* `undefined`

### secretAccessKey (`required`)

The AWS secret for the user that has the ability to upload to the `bucket`.

*Default:* `undefined`

### bucket (`required`)

The AWS bucket that the files will be uploaded to.

*Default:* `undefined`

### region (`required`)

The region the AWS `bucket` is located in.

*Default:* `undefined`

### acl

The ACL to apply to the objects.

*Default:* `public-read`

### prefix

A directory within the `bucket` that the files should be uploaded in to.

*Default:* `''`

### filePattern

Files that match this pattern will be uploaded to S3. The file pattern must be relative to `distDir`.

*Default:* `'**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2}'`

### distDir

The root directory where the files matching `filePattern` will be searched for. By default, this option will use the `distDir` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distDir`

### distFiles

The list of built project files. This option should be relative to `distDir` and should include the files that match `filePattern`. By default, this option will use the `distFiles` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distFiles`

### gzippedFiles

The list of files that have been gziped. This option should be relative to `distDir`. By default, this option will use the `gzippedFiles` property of the deployment context, provided by [ember-cli-deploy-gzip][3].

This option will be used to determine which files in `distDir`, that match `filePattern`, require the gzip content encoding when uploading.

*Default:* `context.gzippedFiles`

### manifestPath

The path to a manifest that specifies the list of files that are to be uploaded to S3.

This manifest file will be used to work out which files don't exist on S3 and, therefore, which files should be uploaded. By default, this option will use the `manifestPath` property of the deployment context, provided by [ember-cli-deploy-manifest][4].

*Default:* `context.manifestPath`

## Prerequisites

The following properties are expected to be present on the deployment `context` object:

- `distDir`      (provided by [ember-cli-deploy-build][2])
- `distFiles`    (provided by [ember-cli-deploy-build][2])
- `gzippedFiles` (provided by [ember-cli-deploy-gzip][3])
- `manifestPath` (provided by [ember-cli-deploy-manifest][4])

## Running Tests

- `npm test`

[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[3]: https://github.com/lukemelia/ember-cli-deploy-gzip "ember-cli-deploy-gzip"
[4]: https://github.com/lukemelia/ember-cli-deploy-manifest "ember-cli-deploy-manifest"
[5]: https://github.com/ember-cli-deploy/ember-cli-deploy-s3 "ember-cli-deploy-s3"
