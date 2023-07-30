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
  // console.log(parsedCourse.cover);
  // console.log(req.files);
  const newModules = parsedModules.map((parsedModule) => {
    // console.log(parsedModule.cover);
    const moduleCover = req.files.find((coverFile) => {
      return coverFile.originalname === parsedModule.cover.title;
    });
    parsedModule.cover = moduleCover.path.replace('public', 'http://api.sova-courses.site');
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
              contentEl.attrs.src = foundFile.path.replace('public', 'http://api.sova-courses.site');
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
  const newPath = courseCover.path.replace('public', 'http://api.sova-courses.site');

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
  const { moduleData } = req.body;
  const { id } = req.params;
  Courses.findById(id)
  .then((doc) => {
    const { title, cover } = JSON.parse(moduleData);
    // console.log(cover);
    if(typeof cover !== 'string') {
      const foundPic = req.files.find((file) => {
        return file.originalname === cover.title;
      });
      const newPath = foundPic.path.replace('public', 'http://api.sova-courses.site');
      doc.modules.push({title: title, cover: newPath});
      doc.save();
      return res.status(201).send(doc);
    } 
    doc.modules.push({title: title, cover: cover});
    doc.save();
    return res.status(201).send(doc);
  })
};

const editModuleFromCourse = (req, res) => {
  const { id, moduleId } = req.params;
  
  const { coverFile } = req.body;


  console.log(JSON.parse(coverFile));
  Courses.findById(id)
  .then((doc) => {
    if(JSON.parse(coverFile).title) {
      const { title } = JSON.parse(coverFile);
      const foundFile = req.files.find((file) => {
        return file.originalname === title;
      });
      console.log(foundFile);
      const updatedModules = doc.modules.map((module) => {
        return module._id.toString() === moduleId ? {...module, cover: foundFile.path.replace('public', 'http://api.sova-courses.site')}  : module;
      });
      doc.modules = updatedModules;
      doc.save();
      // console.log(doc);
      return res.status(201).send(doc);
    } else {
      const { link } = JSON.parse(coverFile);
      const updatedModules = doc.modules.map((module) => {
        return module._id.toString() === moduleId ? {...module, cover: link}  : module;
      });
      doc.modules = updatedModules;
      doc.save();
      console.log(doc);
      return res.status(201).send(doc);
    }
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
          return lesson._id.toString() === lessonID ? {...lesson, cover: foundFile.path.replace('public', 'http://api.sova-courses.site')} : lesson;
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

  Courses.findById(courseID)
  .then((doc) => {
    const updatedContent = content.content.map((element) => {
      return element.type === 'image' || element.type === 'video' ? {...element, attrs: {...element.attrs, src: req.files.find((file) => {
            return file.originalname.includes(element.attrs.title);
      }).path.replace('public', 'http://api.sova-courses.site')}} : element;

    });

    if(cover.title) {
      const fileToInsert = req.files.find((file) => {
        return file.originalname === cover.title;
      });

      console.log(fileToInsert);
      // console.log(updatedContent);
      const updatedModules = doc.modules.map((module) => {
        return module._id.toString() === moduleID ? {...module, lessons: [...module.lessons, {title: title, cover: fileToInsert.path.replace('public', 'http://api.sova-courses.site'), content: {...content, content: updatedContent}}]} : module;
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
  Courses.findById(courseID)
  .then((foundCourse) => {
    // console.log(foundCourse);
    if(!foundCourse) {
      return;
    }
    // const studentsToInsert = students.filter((student) => {
    //   return !foundCourse.students.includes(student);
    // });
    // // console.log(studentsToInsert);
    students.forEach((student) => {
      foundCourse.students.push(student);
    });

    foundCourse.save();
    return foundCourse.populate('students')
    .then((populatedCourse) => {
      res.status(201).send(populatedCourse);
    })
    
  })
};

module.exports = {
  requestCourses,
  // redirectToCourse,
  getCourse,
  createCourse,
  editCourse,
  getLesson,
  addStudentsToCourse,
  deleteModuleFromCourse,
  deleteLessonFromCourse,
  editModuleFromCourse,
  editLessonFromCourse,
  editLessonContentFromCourse,
  addLessonToCourse
}