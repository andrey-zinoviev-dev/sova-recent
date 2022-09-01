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

mongoose.connect('mongodb://localhost:27017/sova');

const app = express();
//server initialization
const httpServer = createServer(app);
//socket initialization
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3001', 'http://localhost:3002'],
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
    const { localsessionID } = socket.handshake.auth;
    if(localsessionID) {
        socket.sessionID = localsessionID;
        return next();
    }
    const generatedSessionID = crypto.randomBytes(8).toString('hex');
    socket.sessionID = generatedSessionID;
    return next();
});

io.on('connection', (socket) => {
    // const {sessionID, userID} = socket;
    //get all sesstions connected
    // console.log(sessionsStore.findAllSessions());
    // save session on socket connection
    socket.on('userConnected', (user) => {
        // console.log(users);
        // const { localsessionID } = socket.handshake.auth;
        // if(localsessionID) {
        //     console.log(users);
        // }
        socket.userID = user._id;
        socket.username = user.name;
        const foundUser = users.find((userInList) => {
            return userInList.userID === user._id;
        });
        if(!foundUser) {
            users.push({sessionID: socket.sessionID, userID: user._id, username: user.name});
        }
        // const foundUser = users.find((u) => {
        //     return u._id === user._id;
        // });
        // console.log(socket);
        // console.log(foundUser);
        // const generatedSessionID = crypto.randomBytes(8).toString('hex');
        // // console.log(generatedSessionID);
        // socket.sessionID = generatedSessionID;
        // socket.userID = user._id;
        // socket.username = user.name;
        // // console.log(socket);
        
        socket.emit('session', {
            sessionID: socket.sessionID,
            userID:  socket.userID,
        });

        socket.emit('users', users);
    });
    // users.push({sessionID: sessionID, userID: userID});

    // sessionsStore.saveSession(sessionID, {
    //     userID: userID,
    //     connected: true,
    // });
    // console.log(users);

    // socket.join(socket.userID);

    // //find all users connected
    
    // socket.emit('users', {users: sessionsStore.findAllSessions()})
    // const socketsMap = io.of('/').sockets;
    // console.log(socketsMap.get(socket.id))
    // // for(let {sessionID} in io.of('/').sockets) {
    // //     console.log(sessionID);
    // // }
    // socket.on('disconnect', () => {
    //     const { sessionID, userID } = socket;
    //     sessionsStore.saveSession(sessionID, {userID, connected: false});
    // });
    // const currentUsers = [];
    // for(let [id, socket] of io.of('/').sockets) {
    //     console.log(socket);
    //     // currentUsers.push({id: id, user: socket.user})
    // };
    // socket.emit('users', currentUsers);
    
    // // console.log(socket);
    // socket.on('chat message', ({objToSend, to}) => {
    //     socket.to(to).emit('chat message', {
    //         content: objToSend,
    //         from: socket.id,
    //     });
    // });
    // socket.on('connected to course', (user) => {
    //     // console.log(socket);
    //     console.log(user);
    // })
});

//cors setup
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:3001', 'http://localhost:3002'],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
}))

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

//html template engine
app.set('view engine', 'ejs');
app.use("/", router);
//jwt middleware
app.use(secureRoutes);
app.use("/", securedRouter);

httpServer.listen(3000, () => {
    console.log('server is up');
})