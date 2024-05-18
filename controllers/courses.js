// const { populate } = require('../models/chatMessage');
// const fs = require("fs");
const { Courses, lessonModules } = require('../models/courseModel');
const bcrypt = require('bcrypt');
const { getMessagesOfUser } = require('./messages');
const User = require('../models/userModel');
const CSVToJSON = require('csvtojson');
const nodemailer = require('nodemailer');

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const transporter = nodemailer.createTransport({
    host: 'sm6.hosting.reg.ru',
    port: 465,
    pool: true,
    secure: true,
    auth: {
        user: 'admin@sova-courses.site',
        pass: "testpassword",
    }
});

const dotenv = require("dotenv");
dotenv.config();

const generatePassword = require('password-generator');

//s3 initiation
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  endpoint: "https://storage.yandexcloud.net",
})

const requestCourses = (req, res, next) => {
  // console.log(req.user);
  Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
  .then((docs) => {
    // console.log(docs);
    if(!docs) {
      return res.status(401).send({
        message: "Курсы не найдены"
      });
    }
    const coversToRead = docs.map((doc) => {
      const readCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: doc.cover.title,
      });
      return getSignedUrl(s3, readCommand, {expiresIn: 60})
      .then((url) => {
        return doc.cover.path = url;
      })
      .catch((err) => {
        throw new Error ("не найдены файлы");
      })
    });
    Promise.all(coversToRead)
    .then((covers) => {
      // console.log(covers);
      return res.status(200).send(docs);
    })
    .catch((err) => {
      next({codeStatus: 401, message: err.message})
    })
    // console.log(docs);
    
  });
};

const getCourse = (req, res) => {
  const { id } = req.params;
  Courses.findById(id).populate({path: 'modules'}).populate({path: 'author'}).populate({path: 'students'})
  .then((doc) => {
    const readCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: doc.cover.title,
    });
    getSignedUrl(s3, readCommand, {expiresIn: 60})
    .then((url) => {
      doc.cover.path = url;
      Promise.all(doc.modules.map((docModule) => {

        const moduleCoverCommand = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: docModule.cover.title,
        })

        return getSignedUrl(s3, moduleCoverCommand, {expiresIn: 60})
        .then((url) => {
          docModule.cover.path = url;
          return Promise.all(docModule.lessons.map((moduleLesson) => {
            const lessonCoverCommand = new GetObjectCommand({
              Bucket: process.env.BUCKET_NAME,
              Key: moduleLesson.cover.title,
            });

            return getSignedUrl(s3, lessonCoverCommand, {expiresIn: 60})
            .then((lessonUrl) => {
              moduleLesson.cover.path = lessonUrl;
              return moduleLesson;
            })

          }))
          .then((lessonsCovers) => {
            // console.log(lessonsCovers);
            docModule.lessons = lessonsCovers;
            return docModule;
          })

          // console.log(updatedLessons);
          // docModule.lessons = updatedLessons;
        })
      }))
      .then(() => {
        res.status(201).send(doc);
      })
    })
  })
};

const findCourse = (req, res, next) => {
  const { name } = req.params;
  // console.log(name);
  Courses.findOne({name: name})
  .then((doc) => {
    if(doc) {
      throw new Error("Курс уже есть");
    }
    res.status(200).send({noCourse: true});
  })
  .catch((err) => {
    next({codeStatus: 400, message: err.message})
  })
};

const createCourse = (req, res, next) => {
  // console.log(req.body);
  const {courseData, author} = req.body;
  // console.log(courseData);
  const { course, modules, tarifs, students } = courseData;
  // console.log(students);
  // const { course } = courseData;
  // const { _id } = JSON.parse(author);
  // console.log(_id);
  // const {course, modules, tarifs, students} = JSON.parse(courseData);
  
  Courses.findOne({name: course.name})
  .then((doc) => {
    // console.log(doc);
  //   // modules.forEach((module) => {
  //   //   console.log(module.lessons.content);
  //   // })
  //   // console.log(doc);
    if(doc) {
      throw new Error("Курс уже существует");
    } 

    return Courses.create({name: course.name, description: course.description, author: author._id, modules: modules.map((module) => {
      return {...module, title: module.name, cover: module.cover, author: author}
    }), cover: course.cover, tarifs: tarifs ? tarifs : [], students: []})
    .then((createdCourse) => {
      if(!createdCourse) {
        throw new Error("Что-то при создании курса пошло не так, попробуйте еще раз");
      }

      return Promise.all((students.map((student) => {
        return User.findOne({email: student.email})
      .then((doc) => {
        if(!doc) {
          const generatedPassword = generatePassword(10, false);
          return bcrypt.hash(generatedPassword, 10)
          .then((hash) => {
            return User.create({email: student.email, password: hash, name: student.name, admin: false, courses: [{id: createdCourse._id, contacts: student.tarif === "admin" ? students.filter((studentsEl) => {
              return studentsEl.admin === student.email; 
            }).map((student) => {
              return student.email;
            }) : student.admin !== "null" ? [student.admin] : [], tarif: student.tarif}]})
            .then((newUser) => {
              transporter.sendMail({
                from: '"Sasha Sova" <admin@sova-courses.site>',
                to: student.email,
                subject: 'Добро пожаловать на платформу Саши Совы!',
                html: `
                  <h1>Сова тебя приветствует на курсе ${createdCourse.name}!</h1>
                  <div>
                    <p>Твой логин- ${student.email}</p>
                    <p>Твой пароль- ${generatedPassword}</p>
                  </div>
                  <button style="font-size:20px">
                    <a href="https://sova-courses.site">Присоединиться</a>
                  </button>
                `
              })
              return newUser._id;
            })
          })
        } else {
                // doc.courses = 
                // if(!doc.courses.find((course) => {
                //   return course.id.toString() === foundCourse._id.toString();
                // })) {
                doc.courses.push({id: createdCourse._id, tarif: student.tarif, contacts: student.tarif === "admin" ? students.filter((studentsEl) => {
                  return studentsEl.admin === student.email; 
                }).map((student) => {
                  return student.email;
                }) : student.admin !== 'null' ? [student.admin] : []});
                doc.save();
                // }
                return doc._id;
              }
            })
      })))
      .then((createdStudents) => {
        createdCourse.students = createdStudents;
        createdCourse.save();
        return res.status(201).send({course: createdCourse});
      })
      .catch((err) => {

      });

      // return res.status(201).send({course: data});
    })
    .catch((err) => {
      next({codeStatus: 500, message: err.message});
    })

   



  //   // const fileUploadCommands = req.files.map((file) => {
  //   //     const uploadCommand = new PutObjectCommand({
  //   //           Bucket: process.env.BUCKET_NAME,
  //   //           Key: file.originalname,
  //   //           Body: file.buffer,
  //   //           ContentType: file.mimetype
  //   //     });
        
  //   //     return s3.send(uploadCommand)
  //   //         // .then((sentFile) => {
  //   //         //   console.log(sentFile);
  //   //         // })
  //   //   })
    



  //   // Promise.all(fileUploadCommands)
  //   // .then((data) => {
  //   //   Courses.create({name: course.name, description: course.description, author: _id, modules: modules.map((module) => {
  //   //     return {...module, title: module.name, cover: module.cover, author: JSON.parse(author)}
  //   //   }), cover: course.cover, tarifs: tarifs, students: []})
  //   //   .then((createdCourse) => {
  //   //     // return res.status(201).send(createdCourse); 
  //   //     //create users
  //   //     const studentsAdded = students.map((user) => {
  //   //       return User.findOne({email: user.email})
  //   //       .then((doc) => {
  //   //         if(!doc) {
  //   //           const generatedPassword = generatePassword(10, false);
  //   //           return bcrypt.hash(generatedPassword, 10)
  //   //           .then((hash) => {
  //   //             return User.create({email: user.email, password: hash, name: user.name, admin: false, courses: [{id: createdCourse._id, tarif: user.tarif}]})
  //   //             .then((newUser) => {
  //   //               transporter.sendMail({
  //   //                 from: '"Sasha Sova" <admin@sova-courses.site>',
  //   //                 to: user.email,
  //   //                 subject: 'Добро пожаловать на платформу Саши Совы!',
  //   //                 html: `
  //   //                     <h1>Сова тебя приветствует на курсе ${createdCourse.name}!</h1>
  //   //                     <div>
  //   //                         <p>Твой логин- ${user.email}</p>
  //   //                         <p>Твой пароль- ${generatedPassword}</p>
  //   //                     </div>
  //   //                     <button>
  //   //                         <a href="https://sova-courses.site">Присоединиться</a>
  //   //                     </button>
  //   //                 `
  //   //               })
  //   //               return newUser._id;
  //   //             })
  //   //           })
  //   //         } else {
  //   //           // doc.courses = 
  //   //           // if(!doc.courses.find((course) => {
  //   //           //   return course.id.toString() === foundCourse._id.toString();
  //   //           // })) {
  //   //           doc.courses.push({id: createdCourse._id, tarif: user.tarif});
  //   //           doc.save();
  //   //           // }
  //   //           return doc._id;
  //   //         }
  //   //       })
  //   //     });

  //   //     Promise.all(studentsAdded)
  //   //     .then((value) => {
  //   //       createdCourse.students = value;
  //   //       createdCourse.save();

  //   //       User.find({admin: false})
  //   //       .then((users) => {
  //   //         users.forEach((user) => {
  //   //           transporter.sendMail({
  //   //             from: '"Sasha Sova" <admin@sova-courses.site>',
  //   //             to: user.email,
  //   //             subject: `Новый курс: ${course.name}!`,
  //   //             html: `
  //   //                 <h1>Появился новый курс ${course.name}!</h1>
  //   //                 <button>
  //   //                     <a href="http://localhost:3001/courses/${createdCourse.id.toString()}/modules/${createdCourse.modules[0].id.toString()}/lessons/${createdCourse.modules[0].lessons[0]._id.toString()}">Посмотреть</a>
  //   //                 </button>
  //   //             `
  //   //           })
  //   //         })
  //   //       })

  //   //       res.status(201).send(createdCourse);      
  //   //     })

  //   //   })
  //   //   .catch((err) => {
  //   //     next({codeStatus: 400, message: err.message})
  //   //   })
  //   // })
  })
  .catch((err) => {
    next({codeStatus: 400, message: err.message})
  })
};

const deleteCourse = (req, res, next) => {
    const { courseID } = req.params;
    Courses.findByIdAndDelete(courseID)
    .then((result) => {
      if(!result) {
        throw new Error("Курс не найден");
      }
      return res.status(200).send({courseId: result._id})
    })
    .catch((err) => {
      next({codeStatus: 400, message: err.message})
    })
};

const editCourse = (req, res) => {
  // console.log(req.files);
  // const { courseData, moduleData, lessonData } = req.body;

  // const { id } = req.params;
  // // console.log(courseData, moduleData, lessonData);
  // // const parsedCourseData = JSON.parse(courseData);
  // // const parsedModuleData = JSON.parse(moduleData);
  // // const parsedLessonData = JSON.parse(lessonData);
  // Courses.findById(id)
  // .then((doc) => {
  //   if(courseData) {
  //     console.log('update course data');
  //   }
  //   if(moduleData) {
  //     const parsedModuleData = JSON.parse(moduleData);
  //     const uploadedModuleCover = req.files.find((file) => {
  //       return file.originalname === parsedModuleData.cover.title;
  //     });
  //     // console.log(parsedModuleData);
  //     parsedModuleData.cover = uploadedModuleCover.path.replace('public', 'https://api.sova-courses.site');
  //     // console.log(parsedModuleData);
  //     const updatedLessons = parsedModuleData.lessons.map((lesson) => {
  //       const foundLessonCover = req.files.find((file) => {
  //         return file.originalname === lesson.cover.title;
  //       });
  //       lesson.cover = foundLessonCover ? foundLessonCover.path.replace('public', 'https://api.sova-courses.site') : lesson.cover;
  //       return lesson;
  //     })
  //     parsedModuleData.lessons = updatedLessons;
  //     const newModules = [...doc.modules, parsedModuleData];
  //     doc.modules = newModules;
  //     doc.save();
  //   }
    
  //   res.status(201).send(doc);
  // })


  // console.log(JSON.parse(moduleData));
  // console.log(req.files);
  // Courses.findById(id)
  // .then((doc) => {
  //   const { title, cover } = JSON.parse(moduleData);
  //   // console.log(cover);
  //   if(typeof cover !== 'string') {
  //     const foundPic = req.files.find((file) => {
  //       return file.originalname === cover.title;
  //     });
  //     const newPath = foundPic.path.replace('public', 'https://api.sova-courses.site');
  //     // const newPath = courseCover.path.replace('public', 'http://localhost:3000');
  //     doc.modules.push({title: title, cover: newPath});
  //     doc.save();
  //     return res.status(201).send(doc);
  //   } 
  //   doc.modules.push({title: title, cover: cover});
  //   doc.save();
  //   return res.status(201).send(doc);
  // })
};

const editCourseTitle = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  Courses.findById(id)
  .then((doc) => {
    if(!doc) {
      return;
    }
    doc.name = name;
    doc.save();
    return res.status(201).send({name: doc.name});
  })
};

const editCourseDesc = (req, res) => {
  const { id } = req.params;
  const { desc } = req.body;
  Courses.findById(id)
  .then((doc) => {
    if(!doc) {
      return;
    }
    doc.description = desc;
    doc.save();
    return res.status(201).send({desc: doc.description, message: "Описание успешно обновлено!"});
  })
};

const editCourseCover = (req, res) => {
  // console.log(req.file);
  const { id } = req.params;
  const { title } = req.body;
  Courses.findById(id)
  .then((doc) => {
    if(!doc) {
      return;
    }

    doc.cover = {title: title};
    doc.save();

    return res.status(201).send({coverPath: doc.cover, message: "Обложка успешно обновлена!"});


    // const readCommand = new GetObjectCommand({
    //   Bucket: process.env.BUCKET_NAME,
    //   Key: title,
    // });

    // return getSignedUrl(s3, readCommand, {
    //   expiresIn: 90,
    // })
    // .then((url) => {
    //   console.log(url);
    // })
    // req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf-8');
    // console.log(req.file);
    // const newCoverPath = req.file.path.replace('public', 'https://api.sova-courses.site');
    // doc.cover = newCoverPath;
    // doc.save();
    // return res.status(201).send({coverPath: doc.cover, message: "Обложка успешно обновлена!"});
  })
};

const editModuleTitle = (req, res) => {
  
  const { courseID, moduleID } = req.params;
  const { title } = req.body;
  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      return;
    }
    const updatedModules = doc.modules.map((module) => {
      return module._id.toString() === moduleID ? {...module, title: title} : module;
    });

    doc.modules = updatedModules;
    doc.save();

    return res.status(201).send({title: title, message: "название модуля успешно обновлено!"});
  })
};

const editModuleCover = (req, res) => {
  const { courseID, moduleID } = req.params;
  const { title } = req.body;
  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      return;
    }

    // req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf-8');
    // req.file.path = req.file.path.replace('public', 'https://api.sova-courses.site');
    // // console.log(req.file);
    const updatedModules = doc.modules.map((module) => {
      return module._id.toString() === moduleID ? {...module, cover: {title: title}} : module;
    });

    doc.modules = updatedModules;
    doc.save();
    return res.status(201).send({cover: {title: title}, message: "Обложка модуля успешно обновлена!"});
  })
};

const getModule = (req, res) => {
  const {courseID, moduleID} = req.params;
  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      throw new Error ("Модуль не найден");
    } else {
      const module = doc.modules.find((module) => {
        return module._id.toString() === moduleID;
      });
      const moduleCoverCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: module.cover.title,
      });
      return getSignedUrl(s3, moduleCoverCommand, {
        expiresIn: 60
      })
      .then((url) => {
        module.cover.path = url;
        Promise.all(module.lessons.map((lesson) => {
          const lessonCoverCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key:lesson.cover.title,
          });
          return getSignedUrl(s3, lessonCoverCommand, {
            expiresIn: 60
          })
          .then((lessonUrl) => {
            lesson.cover.path = lessonUrl;
            return lesson;
          })
        }))
        .then((data) => {
          module.lessons = data;
          res.status(201).send(module);
        })
      })
    }
  })
  // Courses.find
}

const addModuleToCourse = (req, res, next) => {
  // console.log(req.body);
  const { id } = req.params;
  const { title, cover, lessons, author} = req.body;
  // const { moduleData } = req.body;
  // const parsedModuleData = JSON.parse(moduleData);
  // console.log(req.files);
  Courses.findById(id)
  .then((doc) => {
    if(!doc) {
      throw new Error("Курс для обновления не найден");
    }
    doc.modules.push({title: title, cover: cover, lessons: lessons, author: author});
    doc.save();
    return res.status(201).send({moduleAdded: true});
    // console.log(parsedModuleData);
    // // console.log(doc);
    // if(!doc) {
    //   return;
    // }
    // const moduleCover = req.files.find((file) => {
    //   return file.originalname === parsedModuleData.cover.title;
    // });
    // // parsedModuleData.cover = moduleCover.path.replace('public', 'http://localhost:3000');
    // parsedModuleData.cover = moduleCover.path.replace('public', 'https://api.sova-courses.site');

    // // // parsedModuleData.lessons.forEach((lesson) => {
    // // //   console.log(lesson.content);
    // // // })

    // const updatedLessons = parsedModuleData.lessons.map((lesson) => {
    //   const lessonCover = req.files.find((file) => {
    //     return file.originalname === lesson.cover.title;
    //   });
    //   // console.log(lessonCover);
    //   const updatedLessonContent = lesson.content.content.map((lessonContent) => {
    //     if(lessonContent.type === 'image' || lessonContent.type === 'video') {
    //       const lessonFile = req.files.find((lessonFileToSearch) => {
    //         return lessonFileToSearch.originalname === lessonContent.attrs.title;
    //       });
    //       lessonContent.attrs.src = lessonFile.path.replace('public', 'https://api.sova-courses.site');
    //       // lessonContent.attrs.src = lessonFile.path.replace('public', 'http://localhost:3000');
    //       return lessonContent
    //     }
    //     return lessonContent;
    //   });
    //   // console.log(updatedLessonContent);
    //   // lesson.content.content = updatedLessonContent;
      
    // //   // if(lesson)
    // //   // const updated
    // //   // if(lesson.content.content.some((elContent) => {
    // //   //   return elContent.type === 'image' || elContent.type ==='video';
    // //   // })) {
    // //   //   const updatedLessonContent = lesson.content.content.map((contentEl) => {
    // //   //     if(contentEl.type === 'image' || contentEl.type === 'video') {
    // //   //       const contentElementFile = req.files.find((file) => {
    // //   //         return file.originalname === contentEl.attrs.title;
    // //   //       });
    // //   //       contentEl.attrs.src = contentElementFile.path.replace('public', 'http://localhost:3000');
    // //   //     };
    // //   //     return contentEl;
    // //   //   });
    // //   //   // lesson.content.cotnent = updatedLessonContent;
    // //   // } 

    //   return {...lesson, cover: lessonCover.path.replace('public', 'https://api.sova-courses.site'), content: {...lesson.content, content: updatedLessonContent}};
    //   // return {...lesson, cover: lessonCover.path.replace('public', 'http://localhost:3000'), content: {...lesson.content, content: updatedLessonContent}};
    // });

    // parsedModuleData.lessons = updatedLessons;

    // // parsedModuleData.lessons = updatedLessons;
    // doc.modules = [...doc.modules, parsedModuleData];
    // doc.save();
    // res.status(201).send(doc);
  })

}

const editModuleFromCourse = (req, res) => {
  const { id, moduleId } = req.params;
  
  const { moduleData } = req.body;

  const parsedModule = JSON.parse(moduleData);
  // console.log(req.files);
  // console.log(parsedModule);
  Courses.findById(id)
  .then((doc) => {
    let modulesToUse = [];
    const moduleToUpdate = doc.modules.find((module) => {
      return module._id.toString() === moduleId;
    })
    // console.log(moduleToUpdate);
    if(parsedModule.title !== moduleToUpdate.title) {
      moduleToUpdate.title = parsedModule.title;
    }
    // if(parsedModule.lessons.length !== moduleToUpdate.lessons.length || parsedModule.lessons.some((lesson) => {
    //   return lesson.edit;
    // })) {
    //   // console.log(parsedModule.lessons);
    //   if(parsedModule.lessons.length !== moduleToUpdate.lessons.length) {
    //     const lessonsToInsert = parsedModule.lessons.filter((lesson) => {
    //       return !lesson._id;
    //     });
    //     const newLessons = lessonsToInsert.map((lesson) => {
    //       const lessonCoverFile = req.files.find((file) => {
    //         return file.originalname === lesson.cover.title;
    //       });
    //       lesson.cover = lessonCoverFile.path.replace('public', 'http://localhost:3000');
    //       const lessonContent = lesson.content.content.map((contentEl) => {
    //         if(contentEl.type === 'image' || contentEl.type === 'video') {
    //           const contentFile = req.files.find((file) => {
    //             return file.originalname === contentEl.attrs.title;
    //           });
              
    //           contentEl.attrs.src = contentFile.path.replace('public', 'http://localhost:3000');
    //         }
    //         return contentEl;
    //       });

    //       return {...lesson, content: {...lesson.content, content: lessonContent}};

    //     });
    //     modulesToUse = [...modulesToUse, ...newLessons];
    //     // moduleToUpdate.lessons = [...moduleToUpdate.lessons, ...newLessons];

    //   } 
    //   if( parsedModule.lessons.some((lesson) => {
    //     return lesson.edit;
    //   })) {
    //     // console.log('update existing lessons');
    //     const existingLessons = parsedModule.lessons.filter((lesson) => {
    //       return lesson._id;
    //     });

    //     const updatedLessons = existingLessons.map((lesson) => {
    //       const lessonCoverFile = req.files.find((file) => {
    //         return file.originalname === lesson.cover.title;
    //       });

    //       lesson.cover = lessonCoverFile ? lessonCoverFile.path.replace('public', 'http://localhost:3000') : lesson.cover;

    //       const lessonContent = lesson.content.content.map((contentEl) => {
    //         if(contentEl.type === 'image' || contentEl.type === 'video') {
    //           const contentFile = req.files.find((file) => {
    //             return file.originalname === contentEl.attrs.title;
    //           });
    //           contentEl.attrs.src = contentFile ? contentFile.path.replace('public', 'http://localhost:3000') : contentEl.attrs.src;

              
    //           // return {...contentEl, }
    //         }

    //         return contentEl;
    //       });

    //       lesson.content = {...lesson.content, content: lessonContent};

    //       return lesson;

    //     });
    //     modulesToUse = [...modulesToUse, ...updatedLessons];
    //     // console.log(updatedLessons);
    //     // moduleToUpdate.lessons = updatedLessons;

    //     // console.log(lessonsToUpdate);
    //     // const lessonsToUpdate
    //   }
    //   // console.log(parsedModule)
    //   // console.log(moduleToUpdate.lessons);

    //   // const lessonsToInsert = parsedModule.lessons.filter((lesson) => {
    //   //   return !lesson._id;
    //   // });

    //   // const updatedLessonsToInsert = parsedModule.lessons.map((lesson) => {
    //   //   const lessonCover = req.files.find((file) => {
    //   //     return file.originalname === lesson.cover.title;
    //   //   });
    //   // //   // lesson.cover = lessonCover.path.replace('public', 'http://localhost:3000');

    //   //   const updatedLessonContent = lesson.content.content.map((contentElement) => {
    //   //     if(contentElement.type === 'image' || contentElement.type === 'video') {
    //   //       const foundContentFile = req.files.find((file) => {
    //   //         return file.originalname === contentElement.attrs.title;
    //   //       });
    //   //       foundContentFile ? console.log(foundContentFile) : console.log(contentElement.attrs.src);
    //   //       contentElement.attrs.src = foundContentFile ? foundContentFile.path.replace('public', 'http://localhost:3000') : contentElement.attrs.src;
    //   //     }
    //   //     return contentElement;
    //   //     // return contentElement.type === 'image' || contentElement.type === 'video' ? {...contentElement, attrs: {...contentElement.attrs, src: req.files.find((file) => {
    //   //     //   return file.originalname === contentElement.attrs.title;
    //   //     // }) ? req.files.find((file) => {
    //   //     //   return file.originalname === contentElement.attrs.title;
    //   //     // }).path.replace('public', 'http://localhost:3000') : contentElement.attrs.src}} : contentElement;
    //   //   });
    //   //   // console.log(updatedLessonContent);
        
    //   //   return {...lesson, cover:lessonCover ? lessonCover.path.replace('public', 'http://localhost:3000') : lesson.cover, content: {...lesson.content, content: updatedLessonContent}};
    //   // });
      
    //   // if(parsedModule.lessons.length !== moduleToUpdate.lessons.length) {
    //   //   moduleToUpdate.lessons = [...moduleToUpdate.lessons, ...updatedLessonsToInsert];
    //   // } else if (parsedModule.lessons.some((lesson) => {
    //   //   return lesson.edit;
    //   // })) {
    //   //   console.log('update existing lessons');
    //   // }
    //   // return;
    //   // return;
    //   // moduleToUpdate.lessons = [...moduleToUpdate.lessons, ...updatedLessonsToInsert];
    //   console.log(modulesToUse);
    //   return;
    // }
    if(parsedModule.cover.title) {
      const moduleCover = req.files.find((file) => {
        return file.originalname === parsedModule.cover.title;
      });
      moduleToUpdate.cover = moduleCover.path.replace('public', 'https://api.sova-courses.site');
      // moduleToUpdate.cover = moduleCover.path.replace('public', 'http://localhost:3000');
      // doc.cover = moduleCover.path.replace('public', 'http://localhost:3000')
    }
    doc.modules = doc.modules.map((module) => {
      return module._id.toString() === moduleId ? moduleToUpdate : module;
    })
    doc.save();
    return res.status(201).send(doc);
  });
};

const editLessonFromCourse = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;

  const { coverFile } = req.body;
  // const cover = JSON.parse
  Courses.findById(courseID)
  .then((doc) => {
    if(JSON.parse(coverFile).title) {
      const { title } = JSON.parse(coverFile);
      const foundFile = req.files.find((file) => {
        return file.originalname === title;
      });
      const newModules = doc.modules.map((module) => {
        return module._id.toString() === moduleID ? {...module, lessons: module.lessons.map((lesson) => {
          // return lesson._id.toString() === lessonID ? {...lesson, cover: foundFile.path.replace('public', 'http://localhost:3000')} : lesson;
          return lesson._id.toString() === lessonID ? {...lesson, cover: foundFile.path.replace('public', 'https://api.sova-courses.site')} : lesson;
        })} : module;
      });
      doc.modules = newModules;
      doc.save();
      return res.status(201).send(doc);
      // return res.status(201).send(doc);
    } else {
      const { link } = JSON.parse(coverFile);
      const newModules = doc.modules.map((module) => {
        return module._id.toString() === moduleID ? {...module, lessons: module.lessons.map((lesson) => {
          return lesson._id.toString() === lessonID ? {...lesson, cover: link} : lesson;
        })} : module;
      });
      doc.modules = newModules;
      doc.save();
      // console.log(doc);
      return res.status(201).send(doc);
      // return res.status(201).send(doc);
    }
  })
};

const editLessonTitle = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  const { title } = req.body;
  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      return;
    }

    // console.log(doc);
    doc.modules.find((module) => {
      return module._id.toString() === moduleID
    }).lessons.find((lesson) => {
      return lesson._id.toString() === lessonID;
    }).title = title;
    doc.save();
    return res.status(201).send({title: title, message: "Обложка модуля успешно обновлена!"})
  })
};

const editLessonCover = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  const { title } = req.body;

  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      return;
    }
    // console.log(title);
    const lessonToUpdate = doc.modules.find((module) => {
      return module._id.toString() === moduleID
    }).lessons.find((lesson) => {
      return lesson._id.toString() === lessonID;
    });

    lessonToUpdate.cover = {title: title};
    doc.save();
    return res.status(201).send({title: title, message: "Обложка обновлена"});
  })
}

const editLessonContentFromCourse = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  console.log(req.body);
  // const { title, cover, content } = req.body;
  // console.log(lessonData);
  Courses.findById(courseID).populate({path: 'modules', populate: { path: 'students'} }).populate({path: 'author'})
  .then((doc) => {
    if(!doc) {
      throw new Error("Урока в курсе не найдено");
    }
    // const parsedLessonData = JSON.parse(lessonData);

    const lessonToUpdate = doc.modules.find((module) => {
      return module._id.toString() === moduleID;
    }).lessons.find((lesson) => {
      return lesson._id.toString() === lessonID;
    });

    lessonToUpdate.content = req.body;
    doc.save();
    return res.status(201).send({updateContent: true});

    // if(parsedLessonData.title !== lessonToUpdate.title) {
    //   lessonToUpdate.title = parsedLessonData.title;
    // }

    // if(parsedLessonData.cover.title) {
    //   const coverFile = req.files.find((file) => {
    //     return file.originalname === parsedLessonData.cover.title;
    //   });
    //   // console.log(coverFile);
    //   lessonToUpdate.cover = coverFile.path.replace('public', 'https://api.sova-courses.site');
    //   // lessonToUpdate.cover = coverFile.path.replace('public', 'http://localhost:3000');
    // }

    // if(parsedLessonData.content.content.length !== lessonToUpdate.content.content.length) {
    //   const newLessonContent = parsedLessonData.content.content.map((contentEl) => {
    //     if(contentEl.type === 'image' || contentEl.type === 'video') {
    //       const contentFile = req.files.find((file) => {
    //         return file.originalname === contentEl.attrs.title;
    //       });
    //       // return {...contentEl, attrs: {...contentEl.attrs, src: contentFile ? contentFile.path.replace('public', 'http://localhost:3000') : contentEl.attrs.src}};
    //       return {...contentEl, attrs: {...contentEl.attrs, src: contentFile ? contentFile.path.replace('public', 'https://api.sova-courses.site') : contentEl.attrs.src}};
    //     };

    //     return contentEl;
        
    //   });
    //   // console.log(newLessonContent);
    //   lessonToUpdate.content = {...lessonToUpdate.content, content: newLessonContent};
    // }
    // doc.save();
    // return res.status(201).send(doc.modules.find((module) => {
    //   return module._id.toString() === moduleID;
    // }));
  })
};

const addLessonToCourse = (req, res) => {
  const { courseID, moduleID } = req.params;
  
  Courses.findById(courseID).populate({path: 'modules', populate: { path: 'students'} }).populate({path: 'author'})
  .then((doc) => {
    const moduleToUpdate = doc.modules.find((module) => {
      return module._id.toString() === moduleID;
    });

    moduleToUpdate.lessons.push(req.body);
    doc.save();
    return res.status(201).send({addedLesson: true});
  })
}

const deleteModuleFromCourse = (req, res) => {
  const { courseID, moduleID } = req.params;
  Courses.findById(courseID)
  .then((doc) => {
    const filteredModules = doc.modules.filter((module) => {
      return module._id.toString() !== moduleID;
    });
    doc.modules = filteredModules;
    doc.save();
    res.status(201).send({moduleID: moduleID});
  })
};

const deleteLessonFromCourse = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  Courses.findById(courseID)
  .then((doc) => {
    const updatedModules = doc.modules.map((module) => {
      return module._id.toString() === moduleID ? {...module, lessons: module.lessons.filter((lesson) => {
        return lesson._id.toString() !== lessonID;
      })} : module;
    });
    doc.modules = updatedModules;
    doc.save();
    res.status(201).send({lessonID: lessonID});
  })
}

const getLesson = (req, res, next) => {
  const { courseID, moduleID, lessonID } = req.params;
  // console.log(courseID, moduleID, lessonID);
  Courses.findById(courseID).populate({path: 'modules'}).populate({path: 'author'}).populate({path: 'students'})
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

    const readCoverCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: lesson.cover.title,
    });

    return getSignedUrl(s3, readCoverCommand, {
      expiresIn: 90
    })
    .then((coverUrl) => {
      lesson.cover.path = coverUrl;
      const updatedArray = lesson.content.content.map((el) => {
        if(el.type === 'image' || el.type === 'video') {
          const readCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: el.attrs.title,
          });
          return getSignedUrl(s3, readCommand, { expiresIn: 60 })
          .then((url) => {
            // console.log(url);
            el.attrs.src = url;
            return el;
          })
          .catch((err) => {
            throw new Error("Не найдены файлы урока");
          })
        } 
        else {
          return new Promise(function(resolve, reject) {
            resolve(el);
          })
          .then((data) => {
            return data;
          })
        }
  
      });
  
      Promise.all(updatedArray)
      .then((data) => {
        lesson.content.content = data;
        res.status(200).send({students: course.students, author: course.author, module, lesson}); 
      })
    })
    .catch((err) => {
      next({codeStatus: 400, message: err.message})
    })

    // const promise = 
    // const readCommand = new GetObjectCommand({
    //   Bucket: process.env.BUCKET_NAME,
    //   Key: lesson.cover.title
    // })
    // getSignedUrl(s3, )

    // const lessonContentMedia = lesson.content.content.filter((el) => {
    //   return el.type === 'image' || el.type === 'video';
    // }).map((el) => {
    //   return el.attrs.title;
    // });

    // Promise.all(lesson.content.content.map((el) => {
    //   const readCommand = new GetObjectCommand({
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: el.attrs.title,
    //   });

    //   return (el.type === "image" || el.type === "video") ?  
    //   getSignedUrl(s3, readCommand, { expiresIn: 60 })
    //   .then((url) => {
    //     // console.log(url);
    //     el.attrs.src = url;
    //     return el;
    //   })
    //   .catch((err) => {
    //     throw new Error("Не найдены файлы урока");
    //   })
    //   : 
    //   new Promise(function(resolve, reject) {
    //     resolve(el);
    //   })
    //   .then((data) => {
    //     // console.log('yes');
    //     // console.log(data);
    //     return el;
    //   })
    //   .catch((err) => {
    //     throw new Error("Не найдены данные урока");
    //   })
 
    // }))
    // .then((data) => {
    //   lesson.content.content = data;
    //   // console.log(lesson)
    //   // console.log(lesson.content.content);
    //   res.status(200).send({module, lesson});
    // })
    // .catch((err) => {
    //   next({codeStatus: 401, message: err.message})
    // })

    // console.log(lessonContentMedia);

  })
};



const addStudentsToCourse = (req, res) => {
  const { courseID } = req.params;

  Courses.findById(courseID).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"})
  .then((foundCourse) => {
    CSVToJSON().fromFile(req.files.pop().path)
    .then((data) => {
      const users = data.map((user) => {
        return User.findOne({email: user.email})
        .then((doc) => {
          if(!doc) {
            const generatedPassword = generatePassword(10, false);
            return bcrypt.hash(generatedPassword, 10)
            .then((hash) => {
              return User.create({email: user.email, password: hash, name: user.name, admin: false, courses: [{id: foundCourse._id, tarif: user.tarif}]})
              .then((newUser) => {
                transporter.sendMail({
                  from: '"Sasha Sova" <admin@sova-courses.site>',
                  to: user.email,
                  subject: 'Добро пожаловать на платформу Саши Совы!',
                  html: `
                      <h1>Сова тебя приветствует на курсе ${foundCourse.name}!</h1>
                      <div>
                          <p>Твой логин- ${user.email}</p>
                          <p>Твой пароль- ${generatedPassword}</p>
                      </div>
                      <button>
                          <a href="https://sova-courses.site">Присоединиться</a>
                      </button>
                  `
                })
                return newUser._id;
              })
            })
          } else {
            // doc.courses = 
            if(!doc.courses.find((course) => {
              return course.id.toString() === foundCourse._id.toString();
            })) {
              doc.courses.push({id: foundCourse._id, tarif: user.tarif});
              doc.save();
            }
            // console.log(doc.courses);
            // doc.courses = !doc.courses.includes(foundCourse._id) ? [...doc.courses, {id: foundCourse._id, tarif: user.tarif}] : doc.courses;
            // doc.save();
            return doc._id;
          }
          // return !doc ? bcrypt.hash('password', 10)
          // .then((hash) => {
          //   return User.create({email: user.emai, password: hash, name: user.name, admin: false, courses: [...foundCourse._id]})
          // })
          // : 
          // doc;
        })
      });

      // console.log(data);

      Promise.all(users)
      .then((result) => {
        // console.log(result);
        // console.log(foundCourse.students);
        const newUsers = result.filter((newUser) => {
          return !foundCourse.students.includes(newUser._id);
        });
        console.log(newUsers);
        // const updatedStudentsList = 

        foundCourse.students = [...foundCourse.students, ...newUsers];

        foundCourse.save();
        return res.status(201).send(foundCourse);

      // //   const usersResult = result.map((user) => {
      // //     return user.found ? User.findById(user.found._id.toString())
      // //     .then((foundUser) => {
      // //       console.log(foundUser);
      // //     }) 
      // //     // user.found.save();
      // //     : 
      // //     bcrypt.hash('password', 10)
      // //     .then((hash) => {
      // //       console.log(hash);
      // //       // return User.create({email: user.email, password: hash, name: user.name, admin: false, courses: []})
      // //       // .then((savedUser) => {
      // //       //   savedUser.courses.push(foundCourse._id);
      // //       //   savedUser.save();
      // //       //   return savedUser;
      // //       // })
      // //     })
      });

      // //   Promise.all(usersResult)
      // //   .then((data) => {
      // //     console.log(data);
      // //     // foundCourse.students = data;
      // //     // foundCourse.save();
      // //     // res.status(201).send(foundCourse);
      // //   });

      // })
    })
    // console.log(foundCourse);
    // if(!foundCourse) {
    //   return;
    // }
    
    // User.bulkWrite(students.map((student) => {
    //   return {updateOne: {
    //     filter: {
    //       _id: student.studentId
    //     },
    //     update: {
    //       courses: {_id: courseID, grade: student.grade}
    //     }
    //   }}
    // }))
    // .then((data) => {
    //   // console.log(data);
    //   User.find({admin: false})
    //   .then((docs) => {
    //     const updatedUsers = docs.filter((filterDoc) => {
    //       return students.find((student) => {
    //         return student.studentId === filterDoc._id.toString();
    //       })
    //     });

    //     foundCourse.students = [...foundCourse.students, ...updatedUsers.map((updatedUser) => {
    //       return updatedUser._id.toString();
    //     })];
    //     foundCourse.save()
    //     .then((savedCourse) => {
    //       if(!savedCourse) {
    //         return;
    //       }
    //       savedCourse.populate([{path: 'modules', populate: {path: "lessons"}}, {path: "author"}, {path: 'students'}])
    //       .then((finalCourse) => {
    //         return res.status(201).send({course: finalCourse, users: docs})
    //       })
    //       // return res.status(201).send({course: savedCourse, users: docs});
    //     })
    //     // Courses.findById(courseID).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
    //     // .then((updatedCourse) => {
    //     //   if(!updatedCourse) {
    //     //     return;
    //     //   }
    //     //   console.log(updatedCourse);
    //     //   res.status(201).send({course: updatedCourse, users: docs})
    //     // })
    //     // res.status(201).send({course: foundCourse, users: docs})
    //   })
    // })
  })
};

const lessonNotification = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  // console.log(req.body);
  Courses.findById(courseID)
  .then((foundCourse) => {
    if(!foundCourse) {
      return;
    }
    // const lessonToSend = foundCourse.modules.find((module) => {
    //   return module._id.toString() === moduleID;
    // }).lessons.find((lesson) => {
    //   return lesson._id.toString() === lessonID;
    // });
    // console.log(lessonToSend);
    req.body.forEach((student) => {
      transporter.sendMail({
        from: '"Sasha Sova" <admin@sova-courses.site>',
        to: student.email,
        subject: `Новый урок на курсе ${foundCourse.name}`,
        html: `
            <h1>На курсе ${foundCourse.name} появился новый урок!</h1>
            <div>
              Посмотреть урок можно по ссылке
              <button>
                  <a href=https://sova-courses.site/courses/${courseID}/modules/${moduleID}/lessons/${lessonID}>Посмотреть курс</a>
              </button>
            </div>

        `
      })
      .then((data) => {
        if(data.messageId) {
          res.status(201).send({message: "Сообщения успешно отправлены!"});
        }
      })
    })
  })
};

const sendEmails = (req, res, next) => {
  // const { courseId } = req.params;
  const { message, users, courseName } = req.body;
  users.forEach((user) => {
    transporter.sendMail({
      from: '"Sasha Sova" <admin@sova-courses.site>',
      to: user.email,
      subject: `Новости о курсе ${courseName}`,
      html: `
          <h1>Обновление на курсе ${courseName}</h1>
          <div>
            <p>${message}</p>
          </div>

      `
    })
  })
  res.status(201).send({message: "Уведомление отправлено"});
  // Courses.findById(courseId)
  // .then((doc) => {
  //   if(!doc) {
  //     throw new Error("Курс уже существует");
  //   }
  //   const messageRecepients = [];
  //   tarifs.forEach((tarif) => {

  //   })
  // })
  // .catch((err) => {
  //   next({codeStatus: 400, message: err.message})
  // })
}

const sendHomeworkEmail = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  const { admin, receiver, homework } = req.body;

  Courses.findById(courseID)
  .then((doc) => {
    if(!doc) {
      return;
    }

    const lesson = doc.modules.find((module) => {
      return module._id.toString() === moduleID;
    }).lessons.find((lesson) => {
      return lesson._id.toString();
    });

    console.log(lesson);
    if(admin) {
      transporter.sendMail({
        from: `"Sasha Sova" <admin@sova-courses.site>`,
        to: receiver,
        subject: `Задание урока ${lesson.title}`,
        html: `
          <h1>Твой куратор проверил твое задание!</h1>
          <p>Посмотри результат</p>
          <button style="font-size:20px">
            <a href=https://sova-courses.site/courses/${courseID}/modules/${moduleID}/lessons/${lessonID}>Открыть урок</a>
          </button>
        `
      })
      .then((result) => {
        return res.status(201).send({emailSent: true});
      })
    } else {
      transporter.sendMail({
        from: `"Sasha Sova" <admin@sova-courses.site>`,
        to: receiver,
        subject: `Задание урока ${lesson.title}`,
        html: `
          <h1>Твой ученик отправил задание на проверку!</h1>
          <p>Посмотри его</p>
          <button style="font-size:20px">
            <a href=https://sova-courses.site/courses/${courseID}/modules/${moduleID}/lessons/${lessonID}>Открыть урок</a>
          </button>
        `
      })
      .then((result) => {
        return res.status(201).send({emailSent: true});
      })
    }
  })


}

module.exports = {
  requestCourses,
  // redirectToCourse,
  getCourse,
  findCourse,
  createCourse,
  deleteCourse,
  editCourseTitle,
  editCourseDesc,
  editCourseCover,
  editModuleTitle,
  editModuleCover,
  editCourse,
  getModule,
  addModuleToCourse,
  getLesson,
  addStudentsToCourse,
  deleteModuleFromCourse,
  deleteLessonFromCourse,
  editModuleFromCourse,
  editLessonFromCourse,
  editLessonContentFromCourse,
  addLessonToCourse,
  lessonNotification,
  sendEmails,
  editLessonTitle,
  editLessonCover,
  sendHomeworkEmail
}