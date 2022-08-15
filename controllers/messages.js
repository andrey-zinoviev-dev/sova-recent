const User = require('../models/userModel');
const { Courses, lessonModules } = require('../models/courseModel'); 
const Message = require('../models/chatMessage');

const sendMessage = (req, res) => {
  
  const { message, courseId, moduleId } = req.body;
  const { _id } = req.user;

  const moduleToUpdate = lessonModules.findById(moduleId)
  .then((courseModule) => {
    return courseModule;
  })

  const messageToSave = Message.create({text: message, user: _id, module: moduleId})
  .then((message) => {
    if(!message) {
      return //process error;
    }
    return message;
    // return User.findByIdAndUpdate(_id, { $addToSet: {
    //   "messages": message,
    // }}, {
    //   new: true,
    // }).populate({path: 'messages'}).select('-password')
    // .then((doc) => {
    //   // return doc;
    //   // doc.messages.push(message);
    //   // return res.status(201).send(message);
    //   // return doc.save();
    // });
  })



  Promise.all([moduleToUpdate, messageToSave])
  .then((values) => {
    const [courseModule, message] = values;
    courseModule.messages.push(message);
    courseModule.save((err, updated) => {
      if(err) {
        return; //process error
      }
      return res.status(201).send(message);
    });
  })
};

module.exports = {
  sendMessage,
}