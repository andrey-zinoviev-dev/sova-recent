const mongoose = require('mongoose');
const userModel = require('./userModel');
const { lessonModules } = require('./courseModel');
const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    text: String,
    module: {
        type: mongoose.Schema.Types.ObjectId, ref: 'module',
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);