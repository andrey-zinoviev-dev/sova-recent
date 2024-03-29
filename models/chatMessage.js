const mongoose = require('mongoose');
const userModel = require('./userModel');
const { lessonModules } = require('./courseModel');
const Conversation = require('./Conversation');

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    text: String,
    to: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
    },
    course: {
        type: mongoose.Schema.Types.ObjectId, ref: "Course",
    },
    module: {
        type: mongoose.Schema.Types.ObjectId, ref: 'module',
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Conversation'
    },
    files: [{
        type: Object,
    }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);