const User = require('../models/userModel');
const { lessonModules } = require('../models/courseModel'); 
const Message = require('../models/chatMessage');

const getMessagesOfUser = ((req, res) => {
  //hardcode, remove it futher
  const courseAuthorId = '62f3bc4e73c05a4c07f9e56a';
  //hardcore, remoe it futher


  const { _id } = req.user;
  const { courseModuleId } = req.params;
  // console.log(courseModuleId);
  // console.log(_id);
  const user = User.findById(_id)
  .then((foundUser) => {
    return foundUser;
  });

  const foundMessages = Message.find({}).populate('user')
  .then((messages) => {
    return messages;
    
  });

  Promise.all([user, foundMessages])
  .then(([foundUser, messages]) => {
    if(foundUser.admin) {
      const moduleMessages = messages.filter((message) => {
        return message.module.toString() === courseModuleId && message.user._id.toString() === foundUser._id.toString() ||  message.module.toString() === courseModuleId && message.to._id.toString() === foundUser._id.toString();
      });
      return res.status(200).send(moduleMessages);
    }


    const moduleMessages = messages.filter((message) => {
      return message.module.toString() === courseModuleId && message.user._id.toString() === foundUser._id.toString() || message.module.toString() === courseModuleId && message.user._id.toString() === courseAuthorId && message.to._id.toString() === foundUser._id.toString();
    });

    if(!moduleMessages) {
      return res.status(400).send({
        message: 'Сообщений пока нет',
      });
    }
    return res.status(200).send(moduleMessages);
  })
  // const userToFind = User.findById(_id)
});

const sendMessage = (req, res) => {
  
  const { message, moduleId } = req.body;
  const { _id } = req.user;
  console.log(message);
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

  Message.create({text: message.text, user: _id, module: message.module, to: message.to })
  .then((message) => {
    if(!message) {
      return //process error;
    }
    return res.status(201).send({message: 'Сообщение отправлено!'});
  })

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