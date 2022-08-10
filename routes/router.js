const express = require('express');
const { login, register } = require('../controllers/user');
const router = express();

// router.get('/courses', (req, res) => {
//     res.status(200).send({message: 'show all courses'});
// });
router.post('/login', login);
router.post('/register', register);

module.exports = {
    router,
}
