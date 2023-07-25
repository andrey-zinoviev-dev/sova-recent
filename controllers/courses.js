// const { populate } = require('../models/chatMessage');
const { Courses, lessonModules } = require('../models/courseModel');
const { getMessagesOfUser } = require('./messages');
const User = require('../models/userModel');

const requestCourses = (req, res) => {
  console.log(req.user);
  Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
  .then((docs) => {
    console.log(docs);
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
  console.log(id);
  User.findById( id ).then(() => {});
  Courses.findById(id).populate({path: 'modules', populate: { path: 'students'} }).populate({path: 'author'})
  .then((doc) => {

    res.status(200).send(doc);
  });
};

const createCourse = (req, res) => {

  const { course, modules, author } = req.body;
  const parsedAuthor = JSON.parse(author);
  const parsedCourse = JSON.parse(course);
  const parsedModules = JSON.parse(modules);
  // console.log(parsedCourse.cover);
  // console.log(req.files);
  const newModules = parsedModules.map((parsedModule) => {
    // console.log(parsedModule.cover);
    const moduleCover = req.files.find((coverFile) => {
      return coverFile.originalname === parsedModule.cover.title;
    });
    parsedModule.cover = moduleCover.path.replace('public', 'http://localhost:3000');
    const {lessons} = parsedModule;
    // console.log(lessons);
    const updatedLessons = lessons.map((lesson) => {
      if(lesson.content) {
        const { content } = lesson.content;
        const updatedContent = content.map((contentEl) => {
          if(contentEl.type === 'image' || contentEl.type === 'video') {
            const foundFile = req.files.find((fileFromMulter) => {
              return fileFromMulter.originalname === contentEl.attrs.title;
            });
              contentEl.attrs.src = foundFile.path.replace('public', 'http://localhost:3000');
          }
          return contentEl;
        });
        // console.log(updatedContent);
        lesson.content.content = updatedContent;
        return lesson;
      }

    })
    return {...parsedModule, lessons: updatedLessons};
  });

  const courseCover = req.files.find((file) => {
    return file.originalname === parsedCourse.cover.title;
  });
  const newPath = courseCover.path.replace('public', 'http://localhost:3000');

  Courses.findOne({name: parsedCourse.name})
  .then((doc) => {
  //   console.log(doc);
    if(doc) {
      return;
    }
    Courses.create({name: parsedCourse.name, description: parsedCourse.description, author: parsedAuthor._id, modules: newModules, cover: newPath})
    .then((createdCourse) => {
      res.status(201).send(createdCourse);      
    })
  })

};

const uploadFilesToCourse = (req, res) => {
  console.log(req.files);
};

const getLesson = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  // console.log(courseID, moduleID, lessonID);
  Courses.findById(courseID)
  .then((course) => {
    // console.log(course);
    const { modules } = course;

    const module = modules.find((module) => {
      return module._id.toString() === moduleID;
    });

    const { lessons } = module;

    const lesson = lessons.find((lesson) => {
      return lesson._id.toString() === lessonID;
    });

    res.status(200).send({module, lesson});
  })
  // lessonModules.findById(courseModuleId).populate({path: "course", populate: {path: "author"}}).populate({path:"course", populate: {path: "modules"}}).populate({path: 'students'}).populate({path: "lessons"})
  // .then((moduleDoc) => {
  //   if(!moduleDoc) {
  //     return res.status(401).send({
  //       message: 'Что-то пошло не так, модуль курса не найден'
  //     });
  //   }
  //   return res.status(200).send(moduleDoc);
  // })
};
// const getCourseModule = (req, res) => {

// };

// const redirectToCourse = (req, res) => {  
//   const { id, courseModuleId } = req.params;
//   const { _id } = req.user;

//   const moduleToFind = lessonModules.findById(courseModuleId).populate({path: 'messages'}).populate({path: 'course', populate: {path: 'modules'}}).populate({path: 'students'}).then((courseModule) => {
//     return courseModule;
//   });
//   // const messagesList = getMessagesOfUser();

//   // const coursesToFind = Courses.findById(id).populate({path: 'modules', populate: {path: 'messages'}}).populate({path: 'author', populate: {path: 'messages'}})
//   // .then((doc) => {
//   //   const courseModuleIndex = doc.modules.findIndex((docModule) => {
//   //     return docModule._id.toString() === courseModuleId;
//   //   });
//   //   return [courseModuleIndex, doc];

//   // });

//   const userToFind = User.findById(_id).select('-password')
//   .then((user) => {
//     return user;
//   });

//   Promise.all([moduleToFind, userToFind]).then((values) => {
//     const [courseModule, user] = values;
    
//     const course = courseModule.course;
//     const courseAuthor = course.author;
//     const modules = course.modules;
//     const courseModuleIndex = modules.findIndex((courseModule) => {
//       return courseModule._id.toString() === courseModule._id.toString();
//     });

//     let courseNextModuleIndex = courseModuleIndex;
//     courseNextModuleIndex +=1;
//     const courseNextModule = modules[courseNextModuleIndex] && modules[courseNextModuleIndex]._id.toString();

//     const userIsAuthor = user._id.toString() === courseAuthor.toString();
//     if(userIsAuthor) {
//       // const moduleStudents = courseModule.students;
      
//       return res.render('../views/course.ejs', {
//         admin: user.admin,
//         title: course.name,
//         length: course.length,
//         lessonTitle: courseModule.name,
//         lessonDescription: courseModule.description,
//         lessonImages: courseModule.images,
//         lessonVideos: courseModule.videos,
//         // chats: moduleStudents,
//         nextLesson: courseNextModule && `http://localhost:3000/courses/${courseModule._id.toString()}/modules/${courseNextModule}`,
//       });
//     };
    
//     // courseModule.messages.forEach((message) => {
//     //   console.log(message.to);
//     // })

//     // const senderMessages = messages.filter((message) => {
//     //   return message.module.toString() === courseModule._id.toString() && message.user._id.toString() === user._id.toString();
//     // });
    
//     // const receiverMessages = messages.filter((message) => {
//     //   return message.module.toString() === courseModule._id.toString() && message.user._id.toString() === course.author.toString();
//     // });
//     // console.log(authorMessages);
//     // let messagesArray = [];
//     // let messagesArray = [...senderMessages, ...receiverMessages];
//     // console.log(messagesArray);

//     return res.render('../views/course.ejs', {
//       admin: user.admin,
//       title: course.name,
//       length: course.length,
//       lessonTitle: courseModule.name,
//       lessonDescription: courseModule.description,
//       lessonImages: courseModule.images,
//       lessonVideos: courseModule.videos,
//       // chatMessages: messagesArray,
//       nextLesson: courseNextModule && `http://localhost:3000/courses/${courseModule._id.toString()}/modules/${courseNextModule}`,
//     });

//   });

//   // res.send('ok');
// };

const addStudentsToCourse = (req, res) => {
  const { courseId, students } = req.body;
  Courses.findById(courseId)
  .then((foundCourse) => {
    if(!foundCourse) {
      return;
    }
    const studentsToInsert = students.filter((student) => {
      return !foundCourse.students.includes(student);
    });
    // console.log(studentsToInsert);
    studentsToInsert.forEach((student) => {
      foundCourse.students.push(student);
    });
    foundCourse.save();
    foundCourse.populate('students')
    .then((populatedCourse) => {
      console.log(populatedCourse);
    })
    res.status(200).send({message: "Ученики успешно добавлены!", updatedCourse: foundCourse});
  })
};

module.exports = {
  requestCourses,
  // redirectToCourse,
  getCourse,
  createCourse,
  uploadFilesToCourse,
  getLesson,
  addStudentsToCourse
}