const express = require('express');
const { showCurrentUser, redirectToLoggedInPage } = require('../controllers/user');
const { requestCourses, redirectToCourse, getCourse } = require('../controllers/courses');
const securedRouter = express();

securedRouter.get('/currentUser', showCurrentUser);
securedRouter.get('/courses', redirectToLoggedInPage);
securedRouter.get('/coursesList', requestCourses);

securedRouter.get('/courses/:id/modules/:courseModuleId', redirectToCourse);
// securedRouter.get('/courses/:id/data', getCourse);

module.exports = {
  securedRouter,
}