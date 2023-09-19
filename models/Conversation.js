const mongoose = require('mongoose');
const userModel = require('./userModel');

const conversationSchema = new mongoose.Schema({
    members: 
        [{
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        }]
    ,
    location: {
        // type: Object,
        course: String,
        module: String,
        lesson: String,
    },
    messages: [
        new mongoose.Schema({
            user: String,
            text: String,
            to: String,
            files: [Object],
            // course: Object,
        }, {timestamps: true})
    ],
} );

module.exports = mongoose.model('Conversation', conversationSchema);

