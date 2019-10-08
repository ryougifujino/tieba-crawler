const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Comment extends Model {
}

Comment.init({
    from_nickname: DataTypes.STRING,
    from_username: DataTypes.STRING,
    content: DataTypes.TEXT,
    created_time: DataTypes.STRING
}, {sequelize, modelName: 'comment'});

module.exports = {
    Comment
};