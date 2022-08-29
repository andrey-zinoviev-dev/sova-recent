const express = require('express');
const { showCurrentUser, redirectToLoggedInPage } = require('../controllers/user');
const { requestCourses, redirectToCourse, getCourse } = require('../controllers/courses');
const { sendMessage } = require('../controllers/messages');
const securedRouter = express();

securedRouter.get('/currentUser', showCurrentUser);
securedRouter.get('/courses', redirectToLoggedInPage);
securedRouter.get('/coursesList', requestCourses);
securedRouter.get('/courses/:id', getCourse);
securedRouter.get('/courses/:id/modules/:courseModuleId', redirectToCourse);
// securedRouter.get('/courses/:id/data', getCourse);
securedRouter.post('/messages', sendMessage);

module.exports = {
  securedRouter,
}