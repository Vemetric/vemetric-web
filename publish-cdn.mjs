import AWS from 'aws-sdk';
import { buildScript } from './build-script.mjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

if (!s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
  throw new Error('S3 Environment Variables are not specified.');
}

const bucket = 'vemetric-cdn';

function createS3Client() {
  return new AWS.S3({
    endpoint: s3Endpoint + '/' + bucket,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    s3BucketEndpoint: true,
    signatureVersion: 'v4',
  });
}

async function uploadObject(params) {
  const { key, body } = params;
  const s3Client = createS3Client();
  try {
    await s3Client
      .upload({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'text/javascript',
      })
      .promise();
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

const mainJs = buildScript();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { version } = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

await uploadObject({
  key: `main.js`,
  body: mainJs,
});
await uploadObject({
  key: `${version}/main.js`,
  body: mainJs,
});
