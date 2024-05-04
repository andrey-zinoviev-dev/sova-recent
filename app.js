const mongoose = require('mongoose');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { InMemorySessionStore } = require('./sessionStore');
const path = require('path');
const cookieParser = require('cookie-parser');

const { router } = require('./routes/router');

const { secureRoutes } = require('./middlewares/auth');

const { securedRouter } = require('./routes/securedRouter');

const User = require('./models/userModel');

const { errorHandler } = require("./middlewares/errorHandler");

// mongoose.connect('mongodb://127.0.0.1:27017/sova')
mongoose.connect('mongodb://127.0.0.1:27017/test')
.catch((err) => {
    console.log(err);
});

mongoose.connection.on('error', err => {
    console.log(err);
  });

const app = express();
//server initialization
const httpServer = createServer(app);
//socket initialization
const io = new Server(httpServer, {
    cors: {
        // origin: false, 
        origin: ['http://localhost:3001', 'http://localhost:3002', 'https://sova-courses.site', 'https://www.sova-courses.site'],
        credentials: true,
    }
});

//inmemory initialization
const sessionsStore = new InMemorySessionStore();
const users = [];

// io.use((socket, next) => {  
//     const { sessionID } = socket.handshake.auth;
//     const foundSession = users.find((user) => {
//         return user.sessionID === sessionID;
//     });
    
//     if(foundSession) {
//         console.log('session is found');
//         socket.sessionID = foundSession.sessionID;
//         socket.userID = foundSession.userID;
//         return next();
//     }
//     console.log('is it getting here?');
//     const generatedSessionID = crypto.randomBytes(8).toString('hex');
//     const userIDGenerated = crypto.randomBytes(8).toString('hex');
//     socket.sessionID = generatedSessionID;
//     socket.userID = userIDGenerated;
//     next();
// });

// io.use((socket, next) => {
//     // console.log(socket);
//     // const { localsessionID } = socket.handshake.auth;
    
//     // if(localsessionID) {
//     //     // console.log(localsessionID);
//     //     socket.sessionID = localsessionID;
//     //     return next();
//     // }
//     // // console.log('another connection');
//     // const generatedSessionID = crypto.randomBytes(8).toString('hex');
//     // socket.sessionID = generatedSessionID;
//     users.push({})
//     return next();
// });

io.on('connection', (socket) => {
    // console.log('yes');
    //uncomment further !!!!!!!!!!!!!!!
    // // save session on socket connection
    socket.on('user connected', (user) => { 
        // console.log(user);    
        // socket.handshake.userID = user._id;
        socket.userId = user._id;
        socket.adminRights = user.admin;
        // socket.adminRight = user.admin;
        socket.join(user._id);
        // console.log(socket.userId, user._id);
        // console.log(users);
        socket.broadcast.emit('show connected user', {userId: user._id, admin: user.admin, online: true});
        
        const foundUserIndex = users.findIndex((userToSearch) => {
            return userToSearch.userId === user._id;
        });
        // console.log(foundUserIndex);
        if(foundUserIndex < 0) {
            
            // console.log('user not found');
            users.push({userId: socket.userId, admin: socket.adminRights, online: true});
            
            // console.log(users);
            socket.emit('show all connected users', users);
        } else {
            // console.log('user found');
            users[foundUserIndex].online = true;
            // console.log(users);
            socket.emit('show all connected users', users);
        }
    });

    socket.on('message', (data) => {
        const { to } = data;
        socket.to(to).emit('private message', data);
    });

    socket.on("send homework", ({to, sendHomework}) => {
        // console.log(to._id);
        socket.to(to._id).emit("sent homework", {...to, sendHomework: sendHomework});
    })

    socket.on('disconnect', (reason) => {
        // console.log(socket);
        // console.log('on disconnect');

        const userToDisconnectIndex = users.findIndex((user) => {
            return user.userId === socket.userId;
        });
        // // console.log(userToDisconnectIndex);
        if(userToDisconnectIndex >= 0) {
            // console.log(users[userToDisconnectIndex]);
            users[userToDisconnectIndex].online = false;
            // console.log(users);
            return socket.broadcast.emit('user to disconnect', users[userToDisconnectIndex]);
            // console.log(users[userToDisconnectIndex])
        }

        // console.log(users);
        // userToDisconnectIndex >= 0 && {...users[userToDisconnectIndex], online: false};
        // console.log('on disconnect');
        // console.log(users);
        // if(userToDisconnect) {
        //     userToDisconnect.online = false;
        //     // console.log('on disconnection');
        //     // console.log(users);
        // };

        // socket.broadcast.emit('user to disconnect', users[userToDisconnectIndex]);

        // console.log(users);
    })
    

    // socket.emit('test', 'polo');
    // socket.on('online users', [{}]);

    // socket.emit('users', [{}]);
    //     socket.userID = user._id;
    //     socket.username = user.name;
        
    //     const foundUserIndex = users.findIndex((userInList) => {
    //         return userInList.userID === user._id;
    //     });
        
    //     if(foundUserIndex < 0) {
    //         users.push({ sessionID: socket.sessionID, userID: user._id, username: user.name, online: true });
    //     } else {
    //         users[foundUserIndex] = { ...users[foundUserIndex], online: true };
    //     }


    //     // console.log(users);

        
    //     socket.emit('session', {
    //         sessionID: socket.sessionID,
    //         userID:  socket.userID,
    //         users: users,
    //     });
    //     socket.join(socket.userID);
    //     // if(socket.username ==='Sova') {
    //     //     console.log('course author is connected');
    //     // }
    //     socket.emit('users', users);

    //     socket.broadcast.emit('user is online', {
    //         userID: socket.userID,
    //         username: user.name,
    //         online: true,
    //     });

    //     socket.on('disconnect', () => {
    //         // console.log(socket);
    //         const foundUserIndex = users.findIndex((userInList) => {
    //             return userInList.userID === user._id;
    //         });
    //         users[foundUserIndex] = {...users[foundUserIndex], online: false};

    //         socket.broadcast.emit('user is offline', {
    //             userID: socket.userID,
    //             username: user.name,
    //             // online: false,
    //             users: users,
    //         });
    //     });

    //     socket.on('message', (data) => {
    //         const { to, file } = data;
    //         // console.log(file);
    //         socket.to(to).emit('private message', data);
    //     });
    // });
    // console.log(socket)
    // socket.on('message', (data) => {
    //     // console.log(data);
    //     const { to, file } = data;
        
    //     socket.to(to).emit('private message', data);
    // });

    // // console.log(socket.userID);

    // // socket.broadcast.emit('disconnect', () => {
    // //     console.log('user disconnected', socket);
    // // })
    // socket.on('disconnect', () => {
    //     // console.log(socket);
    // })
});

//cors setup
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:3001', 'http://localhost:3002', 'https://sova-courses.site', 'https://www.sova-courses.site'],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}))

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit: '50mb'}));

//html template engine
app.set('view engine', 'ejs');
app.use("/", router);
//jwt middleware
app.use(secureRoutes);
app.use("/", securedRouter);
//error middleware
app.use(errorHandler)

httpServer.listen(3000, () => {
    console.log('server is up');
})