const User = require('../models/userModel');
const { lessonModules } = require('../models/courseModel'); 
const Message = require('../models/chatMessage');
const Conversation = require('../models/Conversation');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dotenv = require("dotenv");
dotenv.config();

//s3 initiation
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  endpoint: "https://storage.yandexcloud.net",
});

const getMessagesOfUser = ((req, res, next) => {
  const _id = req.user;
  const {userId, courseID, moduleID, lessonID} = req.params;
  // console.log(courseID, moduleID, lessonID);
  // console.log(userId);
  // const foundUser = User.findById(_id);
  Conversation.findOne({members: {$all: [_id, userId]}, location: {course: courseID, module: moduleID, lesson: lessonID}}).populate('members')
  .then((foundConvo) => {
    if(!foundConvo) {
      throw new Error("Сообщений нет");
    } else {
      // const filteredMessages = foundConvo.messages.filter((message) => {
      //   return message.files.length > 0;
      // });
      // console.log(filteredMessages);
      Promise.all(foundConvo.messages.map((message) => {
        if(message.files.length > 0) {
          const readCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: message.files[0].title,
          });

          return getSignedUrl(s3, readCommand, {
            expiresIn: 90
          })
          .then((url) => {
            message.files[0].path = url;
            return message;
          })
        }
        else {
          return new Promise((resolve, reject) => {
            resolve(message);
          })
          .then((data) => {
            return data;
          })
        }
      }))
      .then((finalMessages) => {
        // console.log(finalMessages);
        return res.status(200).send(finalMessages);

      })
      // return res.status(200).send(foundConvo);
    }
  })
  .catch((err) => {
    next({codeStatus: 400, message: err.message});
  })

  //hardcode, remove it futher
  // const courseAuthorId = '62f3bc4e73c05a4c07f9e56a';
  //hardcore, remoe it futher

  // Message.find({}).populate('user').populate('to').populate('conversation')
  // Message.find({}).populate('conversation')
  // .then((messages) => {
  //   if(!messages) {
  //     return;
  //   }
  //   return res.status(200).send(messages);
  // });

  // const { _id } = req.user;
  // const { courseModuleId } = req.params;
  // // console.log(courseModuleId);
  // // console.log(_id);
  // const user = User.findById(_id)
  // .then((foundUser) => {
  //   return foundUser;
  // });

  // const foundMessages = Message.find({}).populate('user')
  // .then((messages) => {
  //   return messages;
    
  // });

  // Promise.all([user, foundMessages])
  // .then(([foundUser, messages]) => {
  //   if(foundUser.admin) {
  //     const moduleMessages = messages.filter((message) => {
  //       return message.module.toString() === courseModuleId && message.user._id.toString() === foundUser._id.toString() ||  message.module.toString() === courseModuleId && message.to._id.toString() === foundUser._id.toString();
  //     });
  //     return res.status(200).send(moduleMessages);
  //   }


  //   const moduleMessages = messages.filter((message) => {
  //     return message.module.toString() === courseModuleId && message.user._id.toString() === foundUser._id.toString() || message.module.toString() === courseModuleId && message.user._id.toString() === courseAuthorId && message.to._id.toString() === foundUser._id.toString();
  //   });

  //   if(!moduleMessages) {
  //     return res.status(400).send({
  //       message: 'Сообщений пока нет',
  //     });
  //   }
  //   return res.status(200).send(moduleMessages);
  // })
  // const userToFind = User.findById(_id)
});


const sendMessage = (req, res) => {
  const {text, from, to, location} = req.body;
  Conversation.findOne({members: {$all: [from, to]}, location: location})
  .then((foundConvo) => {
    const message = {user: from, to: to, text: text, files:[]};
    if(foundConvo) {
      foundConvo.messages.push(message);
      foundConvo.save();
      return res.status(201).send(foundConvo.messages[foundConvo.messages.length - 1]);
    } else {
      Conversation.create({members: [from, to], messages:[message], location: location})
      .then((newConvo) => {
        return res.status(201).send(newConvo.messages[newConvo.messages.length - 1]);
      })
    }
  })
};

const sendFileInMessage = (req, res, next) => {
  const {messageData} = req.body;
  const parsedMessageData = JSON.parse(messageData);
  const { from, to, location } = parsedMessageData;

  const file = req.file;
  const message = {user: from, to: to, text: "", files:[{title: file.originalname, type: file.mimetype}]};
  


  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype
  });

  s3.send(putCommand)
  .then((data) => {
    // console.log(data);
      Conversation.findOne({members: {$all: [from, to]}, location: location})
      .then((foundConvo) => {
        if(foundConvo) {
          foundConvo.messages.push(message);
          foundConvo.save();
          return res.status(201).send(foundConvo.messages[foundConvo.messages.length - 1])
        } else {
          return Conversation.create({members: [from, to], location: location, messages: [message]})
          .then((createdConvo) => {
            return res.status(201).send(createdConvo.messages[createdConvo.messages.length - 1])
          })
        }
      })  
  })
  .catch((err) => {
    // next({codeStatus: 500, message: "Что-то пошло не так, попробуйте другой файл"})
  })


  // Conversation.findOne({members: {$all: [from, to]}, location: location})
  // .then((foundConvo) => {
  //   if(foundConvo) {
  //     foundConvo.messages.push(message);
  //     foundConvo.save();
  //     return res.status(201).send(foundConvo.messages[foundConvo.messages.length - 1])
  //   } else {
  //     return Conversation.create({members: [from, to], location: location, messages: [message]})
  //     .then((createdConvo) => {
  //       return res.status(201).send(createdConvo.messages[createdConvo.messages.length - 1])
  //     })
  //   }
  // })  
};

const getMessageFile = (req, res) => {
  const { messageID } = req.params;
  const { from, to, location } = req.query;

  Conversation.findOne({members: {$all: [from, to]}, location: JSON.parse(location)})
  .then((foundConvo) => {
    // console.log(foundConvo);
    const messageToRead = foundConvo.messages.find((message) => {
      return message._id.toString() === messageID;
    });

    const getCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: messageToRead.files[0].title,
    });

    getSignedUrl(s3, getCommand, {
      expiresIn: 60
    })
    .then((data) => {
      if(!data) {
        return;
      }
      // console.log(messageToRead);
      messageToRead.files = messageToRead.files.map((file) => {
        return {...file, path: data};
      });
      // console.log(messageToRead);
      res.status(201).send(messageToRead);
    })
    // console.log(messageToRead);
  })
};

module.exports = {
  getMessagesOfUser,
  sendMessage,
  sendFileInMessage,
  getMessageFile
}