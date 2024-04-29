const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//s3 initiation
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  endpoint: "https://storage.yandexcloud.net",
})

const imageUpload = (req, res) => {
  console.log(req.body);
};

const getUploadUrl = (req, res, next) => {
  console.log(req.body);
  const { name } = req.body;
  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: name,
    // ContentType: "application/json"
  })
  getSignedUrl(s3, putCommand, {
    expiresIn: 120,
    
  })
  .then((url) => {
    if (typeof url !== 'string') {
      throw new Error("Что-то пошло не так, попробуйте другой файл");
    }
    res.status(201).send({signedUrl: url});
  })
  .catch((err) => {
    next({codeStatus: 500, message: err.message})
    //process error
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