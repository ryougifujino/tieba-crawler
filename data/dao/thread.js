const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Thread extends Model {
}

Thread.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    bar_name: DataTypes.STRING,
    username: DataTypes.STRING,
    nickname: DataTypes.STRING,
    title: DataTypes.STRING,
    created_time: DataTypes.DATE
}, {sequelize, modelName: 'thread'});

async function saveThread(threadId, barName, username, nickname, title) {
    await sequelize.sync();
    await Thread.upsert({
        id: threadId,
        bar_name: barName,
        username,
        nickname,
        title
    });
}

module.exports = {
    Thread,
    saveThread
};
