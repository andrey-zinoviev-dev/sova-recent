// const { populate } = require('../models/chatMessage');
const { Courses } = require('../models/courseModel');
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
  const coursesToFind = Courses.findById(id).populate('modules')
  .then((doc) => {
    const courseModuleIndex = doc.modules.findIndex((docModule) => {
      return docModule._id.toString() === courseModuleId;
    });
    return [courseModuleIndex, doc];
    // const courseModule = doc.modules[courseModuleIndex];

    // let nextModuleIndex = courseModuleIndex;
    // nextModuleIndex += 1; 

    // const nextCourseModule = doc.modules[nextModuleIndex] ? doc.modules[nextModuleIndex]._id.toString() : undefined;
    // // return [courseModule, nextCourseModule];
    // res.render('../views/course.ejs', {
    //   title: doc.name,
    //   length: doc.length,
    //   lessonTitle: courseModule.name,
    //   lessonDescription: courseModule.description,
    //   lessonImages: courseModule.images,
    //   lessonVideos: courseModule.videos,
    //   nextLesson: nextCourseModule ? `http://localhost:3000/courses/${doc._id.toString()}/modules/${nextCourseModule}` : undefined,
    // });
  });

  const userToFind = User.findById(_id).populate({path: 'messages', populate: {path: 'module'}}).populate({path: 'messages', populate: {path: 'user'}}).select('-password').select('-_id')
  .then((user) => {
    return user;
  });

  Promise.all([coursesToFind, userToFind]).then((values) => {
    const [ [courseModuleIndex, doc], user ] = values;
    const courseModule = doc.modules[courseModuleIndex];
    let nextModuleIndex = courseModuleIndex;
    nextModuleIndex += 1; 

    const nextCourseModule = doc.modules[nextModuleIndex] ? doc.modules[nextModuleIndex]._id.toString() : undefined;

    res.render('../views/course.ejs', {
      title: doc.name,
      length: doc.length,
      lessonTitle: courseModule.name,
      lessonDescription: courseModule.description,
      lessonImages: courseModule.images,
      lessonVideos: courseModule.videos,
      nextLesson: nextCourseModule ? `http://localhost:3000/courses/${doc._id.toString()}/modules/${nextCourseModule}` : undefined,
    });

  });

  // res.send('ok');
};

module.exports = {
  requestCourses,
  redirectToCourse,
  getCourse,
}