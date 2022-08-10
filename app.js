const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const ejs = require('ejs');
const { router } = require('./routes/router');

const { secureRoutes } = require('./middlewares/auth');

const { securedRouter } = require('./routes/securedRouter');

mongoose.connect('mongodb://localhost:27017/sova');

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

//html template engine
app.set('view engine', 'ejs');
app.use("/", router);
//jwt middleware
app.use(secureRoutes);
app.use("/", securedRouter);

app.listen(3000, () => {
    console.log('server is up');
})