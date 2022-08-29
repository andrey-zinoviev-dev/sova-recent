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
const io = new Server(httpServer);

//inmemory initialization
const sessionsStore = new InMemorySessionStore();


io.use((socket, next) => {  
    const { sessionID  } = socket.handshake.auth;
  
    if(sessionID) {
        
        const session = sessionsStore.findSession(sessionID);

        if(session) {  
            console.log ('session found');
            socket.sessionID = sessionID;
            socket.userID = session.userID;
           
            return next();
        }
    }
    const generatedSessionID = crypto.randomBytes(8).toString('hex');
    const userIDGenerated = crypto.randomBytes(8).toString('hex');
    socket.sessionID = generatedSessionID;
    socket.userID = userIDGenerated;

    next();

});

io.on('connection', (socket) => {
    //save session on socket connection
    sessionsStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        connected: true,
    });

    socket.emit('session', {
        sessionID: socket.sessionID,
        userID:  socket.userID,
    });
    socket.join(socket.userID);
    //find all users connected
    // sessionsStore.findAllSessions().forEach((session) => {
    //     console.log(session);
    // });
    const socketsMap = io.of('/').sockets;
    console.log(socketsMap.get(socket.id))
    // for(let {sessionID} in io.of('/').sockets) {
    //     console.log(sessionID);
    // }
    socket.on('disconnect', () => {
        const { sessionID, userID } = socket;
        sessionsStore.saveSession(sessionID, {userID, connected: false});
    });
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