import AWS from "aws-sdk";


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

export async function getSignedUrl(key: string, expiresSeconds = 3600) {
  const params = {
    Bucket: process.env.S3_BUCKET || "",
    Key: key,
    Expires: expiresSeconds,
  }; 
  return s3.getSignedUrl("getObject", params);
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType = "image/png"
) {
  const params = {
    Bucket: process.env.S3_BUCKET || "",
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };
  const result: AWS.S3.ManagedUpload.SendData = await s3.upload(params).promise();
  return result;
}
