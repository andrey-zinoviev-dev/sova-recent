// const { populate } = require('../models/chatMessage');
const { Courses, lessonModules } = require('../models/courseModel');
const { getMessagesOfUser } = require('./messages');
const User = require('../models/userModel');

const requestCourses = (req, res) => {
  Courses.find({}).populate('modules')
  .then((docs) => {
    if(!docs) {
      return res.status(401).send({
        message: "Курсы не найдены"
      });
    }
    // console.log(docs);
    return res.status(200).send(docs);
  });
};

const getCourse = (req, res) => {
  const { id } = req.params;
  Courses.findById(id).populate({path: 'modules', populate: { path: 'students'} }).populate({path: 'author'})
  .then((doc) => {
    res.status(200).send(doc);
  });
};

const getModule = (req, res) => {
  const { courseModuleId } = req.params;
  lessonModules.findById(courseModuleId).populate({path: "course", populate: {path: "author"}}).populate({path:"course", populate: {path: "modules"}}).populate({path: 'students'})
  .then((moduleDoc) => {
    if(!moduleDoc) {
      return res.status(401).send({
        message: 'Что-то пошло не так, модуль курса не найден'
      });
    }
    return res.status(200).send(moduleDoc);
  })
};
// const getCourseModule = (req, res) => {

// };

const redirectToCourse = (req, res) => {  
  const { id, courseModuleId } = req.params;
  const { _id } = req.user;

  const moduleToFind = lessonModules.findById(courseModuleId).populate({path: 'messages'}).populate({path: 'course', populate: {path: 'modules'}}).populate({path: 'students'}).then((courseModule) => {
    return courseModule;
  });
  // const messagesList = getMessagesOfUser();

  // const coursesToFind = Courses.findById(id).populate({path: 'modules', populate: {path: 'messages'}}).populate({path: 'author', populate: {path: 'messages'}})
  // .then((doc) => {
  //   const courseModuleIndex = doc.modules.findIndex((docModule) => {
  //     return docModule._id.toString() === courseModuleId;
  //   });
  //   return [courseModuleIndex, doc];

  // });

  const userToFind = User.findById(_id).select('-password')
  .then((user) => {
    return user;
  });

  Promise.all([moduleToFind, userToFind]).then((values) => {
    const [courseModule, user] = values;
    
    const course = courseModule.course;
    const courseAuthor = course.author;
    const modules = course.modules;
    const courseModuleIndex = modules.findIndex((courseModule) => {
      return courseModule._id.toString() === courseModule._id.toString();
    });

    let courseNextModuleIndex = courseModuleIndex;
    courseNextModuleIndex +=1;
    const courseNextModule = modules[courseNextModuleIndex] && modules[courseNextModuleIndex]._id.toString();

    const userIsAuthor = user._id.toString() === courseAuthor.toString();
    if(userIsAuthor) {
      // const moduleStudents = courseModule.students;
      
      return res.render('../views/course.ejs', {
        admin: user.admin,
        title: course.name,
        length: course.length,
        lessonTitle: courseModule.name,
        lessonDescription: courseModule.description,
        lessonImages: courseModule.images,
        lessonVideos: courseModule.videos,
        // chats: moduleStudents,
        nextLesson: courseNextModule && `http://localhost:3000/courses/${courseModule._id.toString()}/modules/${courseNextModule}`,
      });
    };
    
    // courseModule.messages.forEach((message) => {
    //   console.log(message.to);
    // })

    // const senderMessages = messages.filter((message) => {
    //   return message.module.toString() === courseModule._id.toString() && message.user._id.toString() === user._id.toString();
    // });
    
    // const receiverMessages = messages.filter((message) => {
    //   return message.module.toString() === courseModule._id.toString() && message.user._id.toString() === course.author.toString();
    // });
    // console.log(authorMessages);
    // let messagesArray = [];
    // let messagesArray = [...senderMessages, ...receiverMessages];
    // console.log(messagesArray);

    return res.render('../views/course.ejs', {
      admin: user.admin,
      title: course.name,
      length: course.length,
      lessonTitle: courseModule.name,
      lessonDescription: courseModule.description,
      lessonImages: courseModule.images,
      lessonVideos: courseModule.videos,
      // chatMessages: messagesArray,
      nextLesson: courseNextModule && `http://localhost:3000/courses/${courseModule._id.toString()}/modules/${courseNextModule}`,
    });

  });

  // res.send('ok');
};

module.exports = {
  requestCourses,
  redirectToCourse,
  getCourse,
  getModule,
}