const express = require('express');
const securedRouter = express();
const { showCurrentUser, redirectToLoggedInPage, getAllStudents, register } = require('../controllers/user');
const { requestCourses, getCourse, findCourse, createCourse, editCourseTitle, editCourseDesc, editCourseCover, editCourse, getModule, addModuleToCourse, deleteModuleFromCourse, deleteLessonFromCourse, editModuleFromCourse, editLessonFromCourse, editLessonContentFromCourse, getLesson, addStudentsToCourse, addLessonToCourse, lessonNotification, editModuleTitle, editModuleCover, sendEmails } = require('../controllers/courses');
const { sendMessage, sendFileInMessage, getMessageFile, getMessagesOfUser } = require('../controllers/messages');
const { getConversations } = require('../controllers/conversations');
const { getUploadUrl, fileUpload } = require("../controllers/upload");

const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, 'public/uploads/');
//   }, 
//   filename: function (req, file, callback) {
//     callback(null, Date.now() + Math.round(Math.random() * 1E9) + "-" + file.originalname)
//   }
// });

const memoryStorage = multer.memoryStorage();
const upload = multer({storage: memoryStorage});
// const upload = multer({storage: multerStorage});


securedRouter.post('/register', upload.array('csv'), register)

securedRouter.get('/currentUser', showCurrentUser);
securedRouter.get('/courses', redirectToLoggedInPage);
securedRouter.get('/coursesList', requestCourses);
securedRouter.get('/courses/:id', getCourse);
securedRouter.get('/findCourse/:name', findCourse)
securedRouter.post('/courses/add', upload.array('files'), createCourse);
securedRouter.post('/courses/:courseId/sendEmails', sendEmails)

securedRouter.put('/courses/:id/', upload.array('moduleCover'), editCourse);
securedRouter.put('/courses/:id/title', editCourseTitle);
securedRouter.put('/courses/:id/desc', editCourseDesc);
securedRouter.put('/courses/:id/cover', upload.single('courseCover'), editCourseCover);
securedRouter.put('/courses/:id/addModule', upload.array('moduleCover'), addModuleToCourse);
securedRouter.put('/courses/:courseID/modules/:moduleID/lessons/:lessonID/cover', upload.array('file'), editLessonFromCourse);
securedRouter.put('/courses/:id/modules/:moduleId/editModule', upload.array('coverFile'), editModuleFromCourse);
securedRouter.put('/courses/:courseID/modules/:moduleID/lessons/:lessonID/content', upload.array('file'), editLessonContentFromCourse);
securedRouter.put('/courses/:courseID/modules/:moduleID', upload.array('file'), addLessonToCourse);

securedRouter.put('/courses/:courseID/modules/:moduleID/title', editModuleTitle);
securedRouter.put('/courses/:courseID/modules/:moduleID/cover', upload.single('moduleCover'), editModuleCover);

securedRouter.delete('/courses/:courseID/modules/:moduleID', deleteModuleFromCourse);
securedRouter.delete('/courses/:courseID/modules/:moduleID/lessons/:lessonID/delete', deleteLessonFromCourse);
// securedRouter.post('/courses/add/files', upload.array("files"), uploadFilesToCourse);
// securedRouter.get('/courses/:id/modules/:courseModuleId', redirectToCourse);
securedRouter.get('/courses/:courseID/modules/:moduleID', getModule);
securedRouter.get('/courses/:courseID/modules/:moduleID/lessons/:lessonID', getLesson)
// securedRouter.get('/modules/:courseModuleId/messages', getMessagesOfUser);
// securedRouter.get('/courses/:id/data', getCourse);
securedRouter.get('/contact/:userId/courses/:courseID/modules/:moduleID/lessons/:lessonID/messages', getMessagesOfUser);
securedRouter.post('/messages', upload.single("file"), sendMessage);
securedRouter.post('/messages/files', upload.single("file"), sendFileInMessage);
securedRouter.get('/messages/files/:messageID', getMessageFile);
securedRouter.get('/convos/:userId', getConversations);
securedRouter.get('/students', getAllStudents);
securedRouter.put('/courses/:courseID/students', upload.array('usersFile'), addStudentsToCourse);
securedRouter.post('/courses/:courseID/modules/:moduleID/lessons/:lessonID/notification', lessonNotification);

securedRouter.post('/initiateUpload', getUploadUrl)
securedRouter.post('/uploadFile', upload.single("file"), fileUpload)

module.exports = {
  securedRouter,
}