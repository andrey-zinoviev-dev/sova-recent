const mongoose = require('mongoose');
const userModel = require('./userModel');

const conversationSchema = new mongoose.Schema({
    members: 
         [{
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        }]
    ,
    messages: [
        new mongoose.Schema({
            user: String,
            text: String,
            to: String,
            // course: Object,
        }, {timestamps: true})
    ],
} );

module.exports = mongoose.model('Conversation', conversationSchema);

