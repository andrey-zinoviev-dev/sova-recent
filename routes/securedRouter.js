const express = require('express');
const securedRouter = express();
const { showCurrentUser, redirectToLoggedInPage } = require('../controllers/user');
const { requestCourses, getCourse, createCourse, uploadFilesToCourse, getModule } = require('../controllers/courses');
const { sendMessage, getMessagesOfUser } = require('../controllers/messages');
const { getConversations } = require('../controllers/conversations');

const multer = require('multer');
const multerStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'public/uploads/');
  }, 
  filename: function (req, file, callback) {
    callback(null, Date.now() + Math.round(Math.random() * 1E9) + "-" + file.originalname)
  }
})
const upload = multer({storage: multerStorage});

securedRouter.get('/currentUser', showCurrentUser);
securedRouter.get('/courses', redirectToLoggedInPage);
securedRouter.get('/coursesList', requestCourses);
securedRouter.get('/courses/:id', getCourse);
securedRouter.post('/courses/add', upload.array('files'), createCourse);
// securedRouter.post('/courses/add/files', upload.array("files"), uploadFilesToCourse);
// securedRouter.get('/courses/:id/modules/:courseModuleId', redirectToCourse);
securedRouter.get('/modules/:courseModuleId', getModule)
securedRouter.get('/modules/:courseModuleId/messages', getMessagesOfUser);
// securedRouter.get('/courses/:id/data', getCourse);
securedRouter.post('/messages', upload.array("files"), sendMessage);
securedRouter.get('/convos/:userId', getConversations)

module.exports = {
  securedRouter,
}