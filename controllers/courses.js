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
      const newPath = foundPic.path.replace('public', 'http://localhost:3000');
      doc.modules.push({title: title, cover: newPath});
      doc.save();
      return res.status(201).send(doc);
    } 
    doc.modules.push({title: title, cover: cover});
    doc.save();
    return res.status(201).send(doc);
  })
};

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
};



const addStudentsToCourse = (req, res) => {
  const { courseID } = req.params;
  const { students } = req.body;
  console.log(req.body);
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
  uploadFilesToCourse,
  getLesson,
  addStudentsToCourse,
  deleteModuleFromCourse
}