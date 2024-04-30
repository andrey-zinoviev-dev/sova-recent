const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { Upload } = require("@aws-sdk/lib-storage");

const dotenv = require("dotenv");
dotenv.config();

const S3 = require("aws-sdk/clients/s3");

//s3 initiation
const s3Client = new S3({
  signatureVersion: "v4",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  region: process.env.BUCKET_REGION,
  endpoint: "https://storage.yandexcloud.net",
})
// const s3 = new S3Client({
//   region: process.env.BUCKET_REGION,
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY,
//     secretAccessKey: process.env.SECRET_KEY,
//   },
//   endpoint: "https://storage.yandexcloud.net",
//   // signatur
// })

const imageUpload = (req, res) => {
  console.log(req.body);
};

const getUploadUrl = (req, res, next) => {
  // console.log(req.body);
  // const { name } = req.body;
  // console.log(name);
  // const putCommand = new PutObjectCommand({
  //   Bucket: process.env.BUCKET_NAME,
  //   Key: name,
  // })
  // const bucketParams = {
  //   Bucket: process.env.BUCKET_NAME,
  //   Key: name,
  //   Expires: 120,
  // }

  // const url = s3Client.getSignedUrl('putObject', {
  //   Bucket: process.env.BUCKET_NAME,
  //   Key: `${req.body.name}`,
  //   Expires: 120,
  //   ContentType: req.body.type,
  // });

  // return res.status(201).send({url: url});

  // console.log(url);

  // getSignedUrl(s3, putCommand, {
  //   expiresIn: 120,
  // })
  // .then((url) => {
  //   if (typeof url !== 'string') {
  //     throw new Error("Что-то пошло не так, попробуйте другой файл");
  //   }
  //   res.status(201).send({url: url});
  // })
  // .catch((err) => {
  //   next({codeStatus: 500, message: err.message})
  //   //process error
  // })
};

const initiateUpload = (req, res, next) => {
  const uploads = new Upload({
    client: new S3Client({}),
    params: {}
  })
};

const fileUpload = (req, res) => {
  // console.log(req.file);
  const {buffer, originalname} = req.file;
  // const readStream = fs.createReadStream(originalname, {
  //   flags: "a"
  // });

  // readStream.read(buffer);
  // readStream.on('data', (chunk) => {
  //   console.log(chunk);
  // })
};

module.exports = {
  imageUpload,
  getUploadUrl,
  fileUpload,
}