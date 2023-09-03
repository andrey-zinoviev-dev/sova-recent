// const { populate } = require('../models/chatMessage');
const { Courses, lessonModules } = require('../models/courseModel');
const { getMessagesOfUser } = require('./messages');
const User = require('../models/userModel');

const requestCourses = (req, res) => {
  // console.log(req.user);
  Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
  .then((docs) => {
    // console.log(docs);
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
  // console.log(id);
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
  // parsedModules.forEach((module) => {
  //   console.log(module.lessons);
  // })
  console.log(req.files);
  const newModules = parsedModules.map((parsedModule) => {
    // console.log(parsedModule.cover);
    const moduleCover = req.files.find((coverFile) => {
      return coverFile.originalname === parsedModule.cover.title;
    });
    parsedModule.cover = moduleCover.path.replace('public', 'https://api.sova-courses.site');
    const {lessons} = parsedModule;
    // console.log(lessons);
    const updatedLessons = lessons.map((lesson) => {
      if(lesson.content) {
        const { content } = lesson.content;
        console.log(content);
        const updatedContent = content.map((contentEl) => {
          if(contentEl.type === 'image' || contentEl.type === 'video') {
            const foundFile = req.files.find((fileFromMulter) => {
              return fileFromMulter.originalname === contentEl.attrs.title;
            });
            // console.log(foundFile);
              contentEl.attrs.src = foundFile.path.replace('public', 'https://api.sova-courses.site');
          }
          return contentEl;
        });
        // console.log(updatedContent);
        lesson.content.content = updatedContent;
        if(lesson.cover.title) {
          const lessonCover = req.files.find((lessonFile) => {
            return lessonFile.originalname === lesson.cover.title;
          });
          lesson.cover = lessonCover.path.replace('public', 'https://api.sova-courses.site');
        }
        
      }
      return lesson;
    });
    // console.log(updatedLessons);
    return {...parsedModule, lessons: updatedLessons};
  });

  // console.log(newModules);

  const courseCover = req.files.find((file) => {
    return file.originalname === parsedCourse.cover.title;
  });
  const newPath = courseCover.path.replace('public', 'https://api.sova-courses.site');
  // const newPath = courseCover.path.replace('public', 'http://localhost:3000');
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

const editCourse = (req, res) => {
  // console.log(req.files);
  const { courseData, moduleData, lessonData } = req.body;

  const { id } = req.params;
  // console.log(courseData, moduleData, lessonData);
  // const parsedCourseData = JSON.parse(courseData);
  // const parsedModuleData = JSON.parse(moduleData);
  // const parsedLessonData = JSON.parse(lessonData);
  Courses.findById(id)
  .then((doc) => {
    if(courseData) {
      console.log('update course data');
    }
    if(moduleData) {
      const parsedModuleData = JSON.parse(moduleData);
      const uploadedModuleCover = req.files.find((file) => {
        return file.originalname === parsedModuleData.cover.title;
      });
      // console.log(parsedModuleData);
      parsedModuleData.cover = uploadedModuleCover.path.replace('public', 'http://localhost:3000');
      console.log(parsedModuleData);
      const updatedLessons = parsedModuleData.lessons.map((lesson) => {
        const foundLessonCover = req.files.find((file) => {
          return file.originalname === lesson.cover.title;
        });
        lesson.cover = foundLessonCover ? foundLessonCover.path.replace('public', 'http://localhost:3000') : lesson.cover;
        return lesson;
      })
      parsedModuleData.lessons = updatedLessons;
      const newModules = [...doc.modules, parsedModuleData];
      doc.modules = newModules;
      doc.save();
    }
    
    res.status(201).send(doc);
  })

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

const addModuleToCourse = (req, res) => {
  // console.log(req.body);
  const { id } = req.params;
  const { moduleData } = req.body;
  const parsedModuleData = JSON.parse(moduleData);
  Courses.findById(id)
  .then((doc) => {
    if(!doc) {
      return;
    }
    const moduleCover = req.files.find((file) => {
      return file.originalname === parsedModuleData.cover.title;
    });
    parsedModuleData.cover = moduleCover.path.replace('public', 'http://localhost:3000');

    // parsedModuleData.lessons.forEach((lesson) => {
    //   console.log(lesson.content);
    // })

    const updatedLessons = parsedModuleData.lessons.map((lesson) => {
      const lessonCover = req.files.find((file) => {
        return file.originalname === lesson.cover.title;
      });
      // console.log(lesson.content);
      const updatedLessonContent = lesson.content.content.map((lessonContent) => {
        if(lessonContent.type === 'image' || lessonContent.type === 'video') {
          const lessonFile = req.files.find((lessonFileToSearch) => {
            return lessonFileToSearch.originalname === lessonContent.attrs.title;
          });
          lessonContent.attrs.src = lessonFile.path.replace('public', 'http://localhost:3000');
          return lessonContent
        }
        return lessonContent;
      });
      console.log(updatedLessonContent);
      lesson.content.content = updatedLessonContent;
      
      // if(lesson)
      // const updated
      // if(lesson.content.content.some((elContent) => {
      //   return elContent.type === 'image' || elContent.type ==='video';
      // })) {
      //   const updatedLessonContent = lesson.content.content.map((contentEl) => {
      //     if(contentEl.type === 'image' || contentEl.type === 'video') {
      //       const contentElementFile = req.files.find((file) => {
      //         return file.originalname === contentEl.attrs.title;
      //       });
      //       contentEl.attrs.src = contentElementFile.path.replace('public', 'http://localhost:3000');
      //     };
      //     return contentEl;
      //   });
      //   // lesson.content.cotnent = updatedLessonContent;
      // } 

      return {...lesson, cover: lessonCover.path.replace('public', 'http://localhost:3000')};
    });

    parsedModuleData.lessons = updatedLessons;
    doc.modules = [...doc.modules, parsedModuleData];
    doc.save();
    res.status(201).send(doc);
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
    const moduleToUpdate = doc.modules.find((module) => {
      return module._id.toString() === moduleId;
    })
    // console.log(moduleToUpdate);
    if(parsedModule.title !== moduleToUpdate.title) {
      moduleToUpdate.title = parsedModule.title;
    }
    if(parsedModule.lessons.length !== moduleToUpdate.lessons.length) {
      console.log('update lessons array');
      // console.log(moduleToUpdate.lessons);
      const lessonsToInsert = parsedModule.lessons.filter((lesson) => {
        return !lesson._id;
      });
      console.log(lessonsToInsert);
      // return;
    }
    if(parsedModule.cover.title) {
      const moduleCover = req.files.find((file) => {
        return file.originalname === parsedModule.cover.title;
      });
      moduleToUpdate.cover = moduleCover.path.replace('public', 'http://localhost:3000');
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
      console.log(doc);
      return res.status(201).send(doc);
      // return res.status(201).send(doc);
    }
  })
};

const editLessonContentFromCourse = (req, res) => {
  const { courseID, moduleID, lessonID } = req.params;
  const { content } = req.body;
  Courses.findById(courseID)
  .then((doc) => {
    const updatedModules = doc.modules.map((module) => {
      return module._id.toString() === moduleID ? {...module, lessons: module.lessons.map((lesson) => {
        return lesson._id.toString() === lessonID ? {...lesson, content: content} : lesson;
      })} : module
    });
    doc.modules = updatedModules;
    doc.save();
    res.status(201).send(doc);
  })
};

const addLessonToCourse = (req, res) => {
  const { courseID, moduleID } = req.params;

  const { title, cover, content } = JSON.parse(req.body.moduleData);
  // console.log(req.files);
  Courses.findById(courseID).populate({path: 'modules', populate: { path: 'students'} }).populate({path: 'author'})
  .then((doc) => {
    const updatedContent = content.content.map((element) => {
      return element.type === 'image' || element.type === 'video' ? {...element, attrs: {...element.attrs, src: req.files.find((file) => {
            return file.originalname.includes(element.attrs.title);
      }).path.replace('public', 'https://api.sova-courses.site')}} : element;

    });

    // console.log(updatedContent);

    if(cover.title) {
      const fileToInsert = req.files.find((file) => {
        return file.originalname === cover.title;
      });

      // console.log(fileToInsert);
    //   // console.log(updatedContent);
      const updatedModules = doc.modules.map((module) => {
        return module._id.toString() === moduleID ? {...module, lessons: [...module.lessons, {title: title, cover: fileToInsert.path.replace('public', 'https://api.sova-courses.site'), content: {...content, content: updatedContent}}]} : module;
      });
      
      doc.modules = updatedModules;
      doc.save();
      return res.status(201).send(doc);
    }
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
    res.status(201).send(doc);
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
    res.status(201).send(doc);
  })
}

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
};



const addStudentsToCourse = (req, res) => {
  const { courseID } = req.params;
  const { students } = req.body;
  // console.log(req.body);
  // console.log(courseID);
  const studentsIds = students.map((student) => {
    return student.studentId;
  });
  // console.log(studentsIds);
  Courses.findById(courseID).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
  .then((foundCourse) => {
    // console.log(foundCourse);
    if(!foundCourse) {
      return;
    }
    
    User.bulkWrite(students.map((student) => {
      return {updateOne: {
        filter: {
          _id: student.studentId
        },
        update: {
          courses: {_id: courseID, grade: student.grade}
        }
      }}
    }))
    .then((data) => {
      // console.log(data);
      User.find({admin: false})
      .then((docs) => {
        const updatedUsers = docs.filter((filterDoc) => {
          return students.find((student) => {
            return student.studentId === filterDoc._id.toString();
          })
        });

        foundCourse.students = [...foundCourse.students, ...updatedUsers.map((updatedUser) => {
          return updatedUser._id.toString();
        })];
        foundCourse.save()
        .then((savedCourse) => {
          if(!savedCourse) {
            return;
          }
          savedCourse.populate([{path: 'modules', populate: {path: "lessons"}}, {path: "author"}, {path: 'students'}])
          .then((finalCourse) => {
            return res.status(201).send({course: finalCourse, users: docs})
          })
          // return res.status(201).send({course: savedCourse, users: docs});
        })
        // Courses.findById(courseID).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
        // .then((updatedCourse) => {
        //   if(!updatedCourse) {
        //     return;
        //   }
        //   console.log(updatedCourse);
        //   res.status(201).send({course: updatedCourse, users: docs})
        // })
        // res.status(201).send({course: foundCourse, users: docs})
      })
    })
    // const studentsToInsert = students.filter((student) => {
    //   return !foundCourse.students.includes(student);
    // });
    // // console.log(studentsToInsert);
    // students.forEach((student) => {
    //   User.findByIdAndUpdate(student.studentId)
    //   .then((foundUser) => {
    //     if(!foundUser) {
    //       return;
    //     }
    //     foundUser.courses.push({_id: courseID, grade: student.grade});
    //     foundUser.save();
    //     foundCourse.students.push(student.studentId);
    //   })
    //   // foundCourse.students.push(student.studentId);
    //   // User.updateMany({_id: {$in: student.studentId} }, {
    //   //   $addToSet: {
    //   //     courses: doc._id.toString(),
    //   //   }
    //   // })
    // });

    // foundCourse.save();

    

    // console.log(User.find({admin: false}))

    // const usersToSend = User.find({admin: false})
    // .then((docs) => {
    //   return docs;
    // });

    // const coursesToSend = Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
    // .then((foundCourses) => {
    //   return foundCourses;
    // })

    // Promise.all([usersToSend, coursesToSend])
    // .then((values) => {
    //   const [docs, foundCourses] = values;
    //   console.log(docs, foundCourses);
    // })





    // console.log(foundCourse);
    // return foundCourse.populate('students')
    // .then((populatedCourse) => {
    //   res.status(201).send(populatedCourse);
    // })
    
  })
};

module.exports = {
  requestCourses,
  // redirectToCourse,
  getCourse,
  createCourse,
  editCourse,
  addModuleToCourse,
  getLesson,
  addStudentsToCourse,
  deleteModuleFromCourse,
  deleteLessonFromCourse,
  editModuleFromCourse,
  editLessonFromCourse,
  editLessonContentFromCourse,
  addLessonToCourse
}