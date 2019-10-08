const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Post extends Model {
}

Post.init({
    post_id: DataTypes.STRING,
    thread_id: DataTypes.STRING,
    nickname: DataTypes.STRING,
    username: DataTypes.STRING,
    floor_number: DataTypes.INTEGER,
    comment_total: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    created_time: DataTypes.STRING
}, {sequelize, modelName: 'post'});

module.exports = {
    Post
};