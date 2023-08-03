const User = require('../models/userModel');
const Plan = require('../models/planModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const { Courses } = require('../models/courseModel');

const login = (req, res) => {
    const {email, password} = req.body;
    
    User.findOne({email: email})
    .then((doc) => {
        if(!doc) {
            return res.status(400).send({
                message: "Проверьте почту или пароль",
            });
        }
        return bcrypt.compare(password, doc.password)
        .then((matched) => {
            if(!matched) {
                return res.status(400).send({
                    message: 'проверьте почту или пароль',
                });
            }
            const token = jwt.sign({ _id: doc._id}, 'Alekska_nityk')
            //FOR TEST PURPOSES TOKEN GOES TO LOCALSTORAGE, REVERT TO COOKE LATER
            res.status(200).send({token});

            //UNCOMMENT LATER FOR COOKIE AUTH, NOT IN LOCALSTORAGE
            // return res.cookie('token', token, {httpOnly: true}).status(200).send({
            //     message: "Успешный вход",
            // });
        })
    });
};

const register = (req, res) => {
    const { email, password, name, courses } = req.body;
    // console.log(courses);
    return User.findOne({email: email})
    .then((doc) => {
        if(doc) {
            return res.status(400).send({message: 'Пользователь существует'});
        }
        return bcrypt.hash(password, 10)
        .then((hash) => {
            return User.create({ email: email, password: hash, name: name, courses: courses})
            .then((doc) => {
                if(!doc) {
                    return;
                }
                const coursesIds = courses.map((course) => {
                    return course._id;
                })
                Courses.updateMany({_id: {$in: coursesIds} }, {
                    $addToSet: {
                        students: doc,
                    }
                })
                .then((docs) => {
                    if(!docs) {
                        return;
                    }
                    const updatedCourses = Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
                    .then((returnedCourses) => {
                        return returnedCourses;
                        // if(!docs) {
                        //     return;
                        // }
                        // res.status(201).send(docs);
                    })
                    const updatedUsers = User.find({admin: false})
                    .then((users) => {
                        return users;
                    })
                    Promise.all([updatedCourses, updatedUsers])
                    .then((values) => {
                        const [returnedCourses, users] = values;
                        if(!returnedCourses || !users) {
                            return
                        }
                        res.status(201).send({courses: returnedCourses, students: users});
                    })
                })
                // Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
                // .then((docs) => {
                //     if(!docs) {
                //         return;
                //     }
                //     console.log(docs);
                //     // res.status(201).send(docs);
                // })

                // const token = jwt.sign({ _id: doc._id}, 'Alekska_nityk')
                // return res.status(201).send({token});
            }); 
        })

    })
};

const showCurrentUser = (req, res) => {
    const { _id } = req.user;
    // console.log(_id);
    if(!_id) {
        return res.status(401).send({
            message: "Пользователь не найден",
        });
    }
    User.findById(_id).select('-password')
    .then((doc) => {
        return res.status(200).send(doc);
    })
};

const redirectToLoggedInPage = (req, res) => {
    const { _id } = req.user;
    if(!_id) {
        return res.status(401).send({
            message: "Пользователь не найден",
        });
    }
    User.findById(_id).select('-password').select('-_id')
    .then((doc) => {
        // console.log(doc);
        res.render('../views/loggedIn.ejs', {
            name: doc.name,
        });
        // return res.status(200).send(doc);
    })
    
};

const getAllStudents = (req, res) => {
    User.find({admin: false}).select('-password')
    .then((docs) => {
        if(!docs) {
            return;
        }
        return res.status(200).send(docs);
    })
};

// const registerUser = (req, res) => {
//     console.log(req.body);
// }

const updateuser = (req, res) => {
    // return User.find
}

module.exports = {
    login,
    register,
    showCurrentUser,
    redirectToLoggedInPage,
    getAllStudents,
}