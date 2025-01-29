const express = require('express');
const { login, register, chechUserByEmail, changeUserPassword, refreshUserToken } = require('../controllers/user');
const router = express();

// router.get('/courses', (req, res) => {
//     res.status(200).send({message: 'show all courses'});
// });
router.post('/login', login);
router.post('/register', register);
router.post('/email', chechUserByEmail);
router.put('/newPassword', changeUserPassword);
router.post("/refresh", refreshUserToken);

module.exports = {
    router,
}
