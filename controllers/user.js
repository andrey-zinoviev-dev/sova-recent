const User = require('../models/userModel');
const Plan = require('../models/planModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const { Courses } = require('../models/courseModel');
const CSVToJSON = require('csvtojson');
const generatePassword = require('password-generator');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'sm6.hosting.reg.ru',
    port: 587,
    secure: false,
    auth: {
        user: 'admin@sovacourses.site',
        pass: "testpassword",
    }
})

transporter.verify((err, success) => {
    if(err) {
        console.log(err);
    } else {
        console.log('connected to smtp');
    }
})

// transporter.sendMail({
//     from: 'admin@sovacourses.site',
//     to: ['sttrog_810@mail.ru, sttrog810@gmail.com, dreese12d@gmail.com'],
//     subject: "test smtp sender sova",
//     text: "Тест отправки письма",
// })

const login = (req, res) => {
    const {email, password} = req.body;
    
    User.findOne({email: email})
    .then((doc) => {
        // console.log(doc);
        if(!doc) {
            return res.status(400).send({
                message: "Проверьте почту или пароль",
            });
        }
        return bcrypt.compare(password, doc.password)
        .then((matched) => {
            console.log(matched);
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
    const newPasses = [];
    // console.log(req.files.pop());
    CSVToJSON().fromFile(req.files.pop().path)
    .then((users) => {
        const modifiedUsers = users.map((user) => {
            const generatedPassword = generatePassword(10, false);
            newPasses.push({name: user.name, email: user.email, password: generatedPassword, phone: user.phone});
            // return bcrypt.hash(generatedPassword, 10)
            // .then((hash) => {

            //     // return User.create({email: user.email, password: hash, name: user.name})
            // })
            // return {name: user.name, email: user.email, password: generatedPassword, phone: user.phone}
            // bcrypt.hash(generatedPassword, )
            return bcrypt.hash(generatedPassword, 10)
            .then((hash) => {
                return User.create({email: user.email, password: hash, name: user.name});
            })
        });

        // modifiedUsers.forEach((user) => {
        //     User.create({email: user.email, name: user.name, password: user.password})
        // })
        // const usersWithHashedPasses = modifiedUsers.map((userHashed) => {
        //     return bcrypt.hash(userHashed.password, 10)
        //     .then((hashedPassword) => {
        //         return {name: userHashed.name, email: userHashed.email, password: hashedPassword, phone: userHashed.phone};
        //     })
        // });

        // Promise.all(usersWithHashedPasses)
        // .then((finalUsers) => {
        //     console.log(newPasses);
        //     finalUsers.forEach((finalUser) => {
        //         return User.create({email: finalUser.email, name: finalUser.name, password: finalUser.password})
        //     });
        //     // return User.create({})
        // })
        
        Promise.all(modifiedUsers)
        .then((data) => {
            if(!data) {
                return;
            }
            console.log(newPasses);
            return res.status(201).send({success: true});
        })
        .catch((err) => {
            if(err.code === 11000) {
                res.status(400).send({message: "Кто-то из пользователей уже есть"})
                // throw new Error('Кто-то из пользователей уже есть на платформе')
            }
        })
       
    })
    // const { email, password, name, courses } = req.body;
    // console.log(courses);
    // return User.findOne({email: email})
    // .then((doc) => {
    //     if(doc) {
    //         return res.status(400).send({message: 'Пользователь существует'});
    //     }
    //     return bcrypt.hash(password, 10)
    //     .then((hash) => {
    //         return User.create({ email: email, password: hash, name: name, courses: courses})
    //         .then((doc) => {
    //             if(!doc) {
    //                 return;
    //             }
    //             console.log(doc);
    //             const coursesIds = courses.map((course) => {
    //                 return course._id;
    //             })
    //             Courses.updateMany({_id: {$in: coursesIds} }, {
    //                 $addToSet: {
    //                     students: doc._id.toString(),
    //                 }
    //             })
    //             .then((docs) => {
    //                 if(!docs) {
    //                     return;
    //                 }
    //                 const updatedCourses = Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
    //                 .then((returnedCourses) => {
    //                     return returnedCourses;
    //                     // if(!docs) {
    //                     //     return;
    //                     // }
    //                     // res.status(201).send(docs);
    //                 })
    //                 const updatedUsers = User.find({admin: false})
    //                 .then((users) => {
    //                     return users;
    //                 })
    //                 Promise.all([updatedCourses, updatedUsers])
    //                 .then((values) => {
    //                     console.log(values);
    //                     const [returnedCourses, users] = values;
    //                     if(!returnedCourses || !users) {
    //                         return
    //                     }
    //                     res.status(201).send({courses: returnedCourses, students: users});
    //                 })
    //             })
    //             // Courses.find({}).populate({path: 'modules', populate: {path: "lessons"}}).populate({path: "author"}).populate({path: 'students'})
    //             // .then((docs) => {
    //             //     if(!docs) {
    //             //         return;
    //             //     }
    //             //     console.log(docs);
    //             //     // res.status(201).send(docs);
    //             // })

    //             // const token = jwt.sign({ _id: doc._id}, 'Alekska_nityk')
    //             // return res.status(201).send({token});
    //         }); 
    //     })

    // })
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

const chechUserByEmail = (req, res) => {
    const { email } = req.body;
    User.findOne({email: email}).select('-password')
    .then((doc) => {
        if(!doc) {
            return res.status(400).send({message: "Пользователь не найден"})
        }
        return res.status(200).send(doc);
    })
};

const changeUserPassword = (req, res) => {
    const { email, password } = req.body;
    User.findById(email).select('-password')
    .then((doc) => {
        if(!doc) {
            return res.status(400).send({message: "Пользователь не найден"})
        }
        return bcrypt.hash(password, 10)
        .then((hash) => {
            if(!hash) {
                return;
            }
            doc.password = hash;
            doc.save();
            return res.status(201).send({success: true})
        })
        // return res.status(200).send(doc);
    })
}

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
    chechUserByEmail,
    changeUserPassword,
}