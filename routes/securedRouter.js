const express = require('express');
const { showCurrentUser, redirectToLoggedInPage } = require('../controllers/user');
const { requestCourses, redirectToCourse, getCourse, getModule } = require('../controllers/courses');
const { sendMessage, getMessagesOfUser } = require('../controllers/messages');
const securedRouter = express();

securedRouter.get('/currentUser', showCurrentUser);
securedRouter.get('/courses', redirectToLoggedInPage);
securedRouter.get('/coursesList', requestCourses);
securedRouter.get('/courses/:id', getCourse);
// securedRouter.get('/courses/:id/modules/:courseModuleId', redirectToCourse);
securedRouter.get('/modules/:courseModuleId', getModule)
securedRouter.get('/modules/:courseModuleId/messages', getMessagesOfUser);
// securedRouter.get('/courses/:id/data', getCourse);
securedRouter.post('/messages', sendMessage);

module.exports = {
  securedRouter,
}