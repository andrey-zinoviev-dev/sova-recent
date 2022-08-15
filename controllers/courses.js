// const { populate } = require('../models/chatMessage');
const { Courses, lessonModules } = require('../models/courseModel');
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
  Courses.findById(id)
  .then((doc) => {
    res.status(200).send(doc);
  });
};

// const getCourseModule = (req, res) => {

// };

const redirectToCourse = (req, res) => {  
  const { id, courseModuleId } = req.params;
  const { _id } = req.user;

  const moduleToFind = lessonModules.findById(courseModuleId).populate({path: 'messages'}).populate({path: 'course', populate: {path: 'modules'}}).then((courseModule) => {
    return courseModule;
  });

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
    const modules = course.modules;
    const courseModuleIndex = modules.findIndex((courseModule) => {
      return courseModule._id.toString() === courseModule._id.toString();
    });
    let courseNextModuleIndex = courseModuleIndex;
    courseNextModuleIndex +=1;
    const courseNextModule = modules[courseNextModuleIndex] && modules[courseNextModuleIndex]._id.toString();
    
    
    // const [doc, user] = values;
    // const [ [courseModuleIndex, doc], user ] = values;
    
    // const courseModule = doc.modules[courseModuleIndex];
    // let nextModuleIndex = courseModuleIndex;
    // nextModuleIndex += 1; 

    // const nextCourseModule = doc.modules[nextModuleIndex] && doc.modules[nextModuleIndex]._id.toString();

    const userMessages = courseModule.messages.filter((message) => {
      return message.module.toString() === courseModule._id.toString() && message.user.toString() && user._id.toString();
    });

    const authorMessages = courseModule.messages.filter((message) => {
      return message.module.toString() === courseModule._id.toString() && message.user.toString() === course.author.toString();
    });
    let messagesArray = [...userMessages, ...authorMessages];

    res.render('../views/course.ejs', {
      title: course.name,
      length: course.length,
      lessonTitle: courseModule.name,
      lessonDescription: courseModule.description,
      lessonImages: courseModule.images,
      lessonVideos: courseModule.videos,
      chatMessages: messagesArray.length > 0 && messagesArray,
      nextLesson: courseNextModule && `http://localhost:3000/courses/${courseModule._id.toString()}/modules/${courseNextModule}`,
    });

  });

  // res.send('ok');
};

module.exports = {
  requestCourses,
  redirectToCourse,
  getCourse,
}