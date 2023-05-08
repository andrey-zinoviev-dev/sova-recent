// const { populate } = require('../models/chatMessage');
const { Courses, lessonModules } = require('../models/courseModel');
const { getMessagesOfUser } = require('./messages');
const User = require('../models/userModel');

const requestCourses = (req, res) => {
  Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"})
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

const createCourse = (req, res) => {
  // console.log(req.body);
  const { course, modules } = req.body;
  const parsedCourse = JSON.parse(course);
  const parsedModules = JSON.parse(modules);
  // console.log(parsedModules);
  const newModules = parsedModules.map((parsedModule) => {
    const {lessons} = parsedModule;
    
    const updatedLessons = lessons.map((lesson) => {
      const { content } = lesson.layout;
      const updatedContent = content.map((contentEl) => {
        if(contentEl.type === 'image' || contentEl.type === 'video') {
          const foundFile = req.files.find((fileFromMulter) => {
            return fileFromMulter.originalname === contentEl.attrs.title;
          });
            contentEl.attrs.src = foundFile.path.replace('public', 'http://localhost:3000');
        }
        return contentEl;
      });
      lesson.layout.content = updatedContent;
      return lesson;
    })
    return {...parsedModule, lessons: updatedLessons};
    // lessons.forEach((lesson) => {
    //   const { content } = lesson.layout;
    //   const updatedContent = content.map((contentEl) => {
    //     if(contentEl.type === 'image' || contentEl.type === 'video') {
    //       const foundFile = req.files.find((fileFromMulter) => {
    //         return fileFromMulter.originalname === contentEl.attrs.title;
    //       });
    //       contentEl.attrs.src = foundFile.path.replace('public', 'http://localhost:3000');
    //     }
    //     return contentEl;
    //   });
    //   // console.log(updatedContent);
    // });

  });

  Courses.findOne({name: parsedCourse.name})
  .then((doc) => {
  //   console.log(doc);
    if(doc) {
      return;
    }
    Courses.create({name: parsedCourse.name, description: parsedCourse.description, modules: parsedModules})
    .then((createdCourse) => {
      res.status(201).send(createdCourse);
  //     // console.log(newModules);
  //     const modulesToInsert = newModules.map((newModule) => {
  //       return lessonModules.create({name: newModule.title, lessons: newModule.lessons, course: createdCourse._id, students: []})
  //       // .then((createdModule) => {
  //       //   return createdCourse.updateOne({$addToSet: {modules: createdModule}}, {new: true})
  //       // })
  //     });
  //     Promise.all(modulesToInsert)
  //     .then((results) => {
  //       console.log(results);
  //       createdCourse.modules = results;
  //       createdCourse.save();
  //       res.status(201).send(createdCourse);
  //     })
      
    })
  })

  // console.log(parsedModules);
  // console.log(newModules);

  // const courseObject = JSON.parse(course);
  // // console.log(req.files);
  // const parsedContentObject = JSON.parse(module).text;
  // // console.log(parsedContentObject);
  // const { content } = parsedContentObject;
  // // console.log(content);
  // const contentNotFilesArray = content.filter((contentElement) => {
  //   return contentElement.type !== 'image' && contentElement.type !== 'video';
  //   // return contentElement.type !== 'image' || contentElement.type !== 'video';
  // });
  // // console.log(contentNotFilesArray);
  // const contentFilesArray = content.filter((contentFile) => {
  //   return contentFile.type === 'image' || contentFile.type === 'video';
  // });
  // // console.log(contentFilesArray);
  // const updatedContentFiles = contentFilesArray.map((contentFile) => {
  // //   // console.log(contentFile);
  //   const foundMatch = req.files.find((fileFromMulter) => {
  //     return fileFromMulter.originalname === contentFile.attrs.title;
  //   });
  // //   // console.log('yes');
  //   // console.log(foundMatch);
  //   contentFile.attrs.src = foundMatch.path.replace('public', 'http://localhost:3000')
  //   return contentFile;
  // });
  // // console.log(updatedContentFiles);
  // // // console.log(updatedContentFiles);
  // const newLayout = {...parsedContentObject, content: [...contentNotFilesArray, ...updatedContentFiles]};
  // console.log(newLayout.content);

  // // console.log(updatedContentFiles);
  // // console.log(updatedContentFiles);

  // Courses.findOne({name: parsedCourse.name})
  // .then((doc) => {
  //   console.log(doc);
  //   if(doc) {
  //     return;
  //   }
  //   Courses.create({name: parsedCourse.name, description: parsedCourse.description})
  //   .then((createdCourse) => {
  //     console.log(createdCourse);
  //     // parsedModules.forEach((parsedModule) => {
  //     //   const {title, lessons} = parsedModule;
  //     //   // lessons.forEach((lesson) => {
  //     //   //   const { content } = lesson.layout;
  //     //   //   const updatedContent = content.map((contentEl) => {
  //     //   //     if(contentEl.type === 'image' || contentEl.type === 'video') {
  //     //   //       const foundFile = req.files.find((fileFromMulter) => {
  //     //   //         return fileFromMulter.originalname === contentEl.attrs.title;
  //     //   //       });
  //     //   //       contentEl.attrs.src = foundFile.path.replace('public', 'http://localhost:3000');
  //     //   //     }
  //     //   //     return contentEl;
  //     //   //   });
  //     //   //   // console.log(updatedContent);
  //     //   // });

  //     //   lessonModules.create({name: title, layout: newLayout, course: createdCourse._id})
  //     //   .then(() => {});

  //     // });
  // // //     // console.log(createdCourse);
  // //     lessonModules.create({name: "Модуль Алекс", description: "Первый модуль курса для Алексов", layout: newLayout, course: createdCourse._id})
  // //     .then((createdModule) => {
  // //       createdCourse.modules.push(createdModule);
  // //       createdCourse.save();
  // //       res.status(201).send(createdModule);
  // //     })


  //   })
  // })

  // const { module } = req.body;
  // const {text} = module;
  // // console.log(text.content);
  // const mediaArray = text.content.filter((el) => {
  //   if(el.type === 'image' || el.type === 'video') {
  //     return el;
  //   } else {
  //     return;
  //   }
  // });

  // console.log(req.files);
  // console.log(mediaArray);
  // mediaArray.forEach((mediaEl) => {
  //   console.log(mediaEl.attrs.src);
  // })
};

const uploadFilesToCourse = (req, res) => {
  console.log(req.files);
};

const getModule = (req, res) => {
  const { courseModuleId } = req.params;
  lessonModules.findById(courseModuleId).populate({path: "course", populate: {path: "author"}}).populate({path:"course", populate: {path: "modules"}}).populate({path: 'students'}).populate({path: "lessons"})
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

module.exports = {
  requestCourses,
  // redirectToCourse,
  getCourse,
  createCourse,
  uploadFilesToCourse,
  getModule,
}