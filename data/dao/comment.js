const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Comment extends Model {
}

Comment.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    post_id: DataTypes.STRING,
    nickname: DataTypes.STRING,
    username: DataTypes.STRING,
    content: DataTypes.TEXT,
    created_time: DataTypes.DATE
}, {sequelize, modelName: 'comment'});

async function saveComment(commentId, postId, nickname, username, content, createdTime){
    await sequelize.sync();
    await Comment.upsert({
        id: commentId,
        post_id: postId,
        username,
        nickname,
        content,
        created_time: createdTime
    });
}

module.exports = {
    Comment,
    saveComment
};
