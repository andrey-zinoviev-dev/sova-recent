const Conversation = require('../models/Conversation');

const getConversations = (req, res) => {
    const { userId } = req.params;
    // console.log(userId);
    Conversation.find({ members: { $in: [userId]}}).populate('members')
    .then((data) => {
        if(!data) {
            return;
        }
        // data.filter((convo) => {
        //     return convo.members.includes()
        // })
        return res.status(200).send(data);
    })
};

const createConversation = (req, res) => {
    
};

module.exports = {
    getConversations,
}