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

mongoose.connect('mongodb://127.0.0.1:27017/sova');

const app = express();
//server initialization
const httpServer = createServer(app);
//socket initialization
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3001', 'http://localhost:3002', 'http://sova-courses.site', 'http://www.sova-courses.site'],
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

io.use((socket, next) => {
    // console.log(socket);
    const { localsessionID } = socket.handshake.auth;
    
    if(localsessionID) {
        // console.log(localsessionID);
        socket.sessionID = localsessionID;
        return next();
    }
    // console.log('another connection');
    const generatedSessionID = crypto.randomBytes(8).toString('hex');
    socket.sessionID = generatedSessionID;
    return next();
});

io.on('connection', (socket) => {
    // console.log(socket);
    //uncomment further !!!!!!!!!!!!!!!

    // // save session on socket connection
    socket.on('user connected', (user) => {
        // console.log(user);
        // socket.userID = user._id;
        // socket.username = user.name;
        socket.join(user._id);
        // socket.emit('session', {
        //     sessionID: socket.sessionID,
        // })
        // console.log(socket);
    });
        
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
    // console.log(socket);

    socket.on('message', (data) => {
        // console.log(data);
        const { to, file } = data;
        
        socket.to(to).emit('private message', data);
    });

    // console.log(socket.userID);

    // socket.broadcast.emit('disconnect', () => {
    //     console.log('user disconnected', socket);
    // })
    // console.log(socket);
});

//cors setup
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:3001', 'http://localhost:3002', 'http://sova-courses.site', 'http://www.sova-courses.site'],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
}))

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit: '10mb'}));

//html template engine
app.set('view engine', 'ejs');
app.use("/", router);
//jwt middleware
app.use(secureRoutes);
app.use("/", securedRouter);

httpServer.listen(3000, () => {
    console.log('server is up');
})