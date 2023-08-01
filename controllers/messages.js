const User = require('../models/userModel');
const { lessonModules } = require('../models/courseModel'); 
const Message = require('../models/chatMessage');
const Conversation = require('../models/Conversation');

const getMessagesOfUser = ((req, res) => {
  const _id = req.user;
  const {userId} = req.params;
  // console.log(userId);
  // const foundUser = User.findById(_id);
  Conversation.findOne({members: {$all: [_id, userId]}}).populate('members')
  .then((foundConvo) => {
    // console.log(foundConvo);
    if(!foundConvo) {
      // return;
      return res.status(400).send({message: "Пока нет сообщений"});
    }
    return res.status(200).send(foundConvo);
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
  // console.log(req.files);
  const { text, moduleID, user, to } = req.body;
  // console.log(text, moduleID, user, to);
  // console.log(req.files);
  const filesToSend = req.files.map((file) => {
    const updatedPath = file.path.replace('public', 'http://api.sova-courses.site');
    return {...file, path: updatedPath};
  });

  console.log(filesToSend);

  Conversation.findOne({members: {$all: [user, to]}})
  .then((foundConvo) => {
    // console.log(foundConvo);
    const newMessage = {user: user, to: to, text: text, files: filesToSend};
    console.log(newMessage);
    // const foundConvo = doc.pop();
    // console.log(doc);
    if(foundConvo) {
      foundConvo.messages.push(newMessage);
      const lastMessage = foundConvo.messages[foundConvo.messages.length - 1];
      
      foundConvo.save();

      return res.status(201).send({convo: foundConvo, lastMessage: lastMessage });

      // return Message.create({text: text, user: user, to: to, module: moduleID, conversation: foundConvo, files: req.files})
      // .then((message) =>{
      //   if(!message) {
      //     return; //process error
      //   }
      //   return res.status(201).send(message);
      // });
    }
    return Conversation.create({members: [user, to]})
    .then((createdConvo) => {
      // console.log(createdConvo);
      createdConvo.messages.push(newMessage);
      createdConvo.save();
      return res.status(201).send({ convo: foundConvo, lastMessage: newMessage });
      // if(!convo) {
      //   return;
      // }
      // // console.log('convo exists');
      // return Message.create({text: text, user: user, to: to, module: moduleID, conversation: convo, files: req.files})
      // .then((message) =>{
      //   if(!message) {
      //     return; //process error
      //   }
      //   return res.status(201).send(message);
      // });
    })
  })

  // const { _id } = req.user;

  // const foundUser = User.findById(_id).select('-password')
  // .then((doc) => {
  //   return doc;
  // });
  // console.log(message);
  // const moduleToUpdate = lessonModules.findById(moduleId).populate({path: 'course'})
  // .then((courseModule) => {
  //   if(!courseModule) {
  //     return //process error
  //   }
  //   // console.log(courseModule);
  //   return Message.create({text: message, user: _id, module: moduleId, to: courseModule.course.author.toString()})
  //   .then((message) => {
  //     if(!message) {
  //       return;
  //     }
  //     return res.status(201).send(message);
  //   })
  //   // return courseModule;
  // })

  // const createdMessage = Message.create({text: text, user: _id, module: moduleID, to: to })
  // .then((message) => {
  //   return message;
  // });

  // Promise.all([foundUser, createdMessage])
  // .then(([doc, message]) => {

  //   if(!message || !doc) {
  //     return //process error;
  //   }
  //   message.user = doc;
  //   return res.status(201).send(message);
  // });

  // Promise.all([moduleToUpdate, messageToSave])
  // .then((values) => {
  //   const [courseModule, message] = values;
  //   console.log(courseModule.course);
  //   courseModule.messages.push(message);
  //   courseModule.save((err, updated) => {
  //     if(err) {
  //       return; //process error
  //     }
  //     return res.status(201).send(message);
  //   });
  // })
};

module.exports = {
  getMessagesOfUser,
  sendMessage,
}