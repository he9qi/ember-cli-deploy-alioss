# ember-cli-deploy-alioss

> An ember-cli-deploy [plugin][1] to upload files to Aliyun OSS （阿里云对象储存）.

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
  bucket: '<your-oss-bucket>'
}
```
[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"

## Still WIP
