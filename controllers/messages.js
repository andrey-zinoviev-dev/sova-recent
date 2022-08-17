const User = require('../models/userModel');
const { lessonModules } = require('../models/courseModel'); 
const Message = require('../models/chatMessage');

const getMessagesOfUser = ((req, res) => {
  // const { _id } = req.user;
  return Message.find({}).populate('user')
  .then((messages) => {
    return messages;
  })
  // const userToFind = User.findById(_id)
});

const sendMessage = (req, res) => {
  
  const { message, moduleId } = req.body;
  const { _id } = req.user;

  const moduleToUpdate = lessonModules.findById(moduleId).populate({path: 'course'})
  .then((courseModule) => {
    if(!courseModule) {
      return //process error
    }
    // console.log(courseModule);
    return Message.create({text: message, user: _id, module: moduleId, to: courseModule.course.author.toString()})
    .then((message) => {
      if(!message) {
        return;
      }
      return res.status(201).send(message);
    })
    // return courseModule;
  })

  // const messageToSave = Message.create({text: message, user: _id, module: moduleId})
  // .then((message) => {
  //   if(!message) {
  //     return //process error;
  //   }
  //   return message;
  // })

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