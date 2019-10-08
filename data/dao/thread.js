const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Thread extends Model {
}

Thread.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    author: DataTypes.STRING,
    title: DataTypes.STRING
}, {sequelize, modelName: 'thread'});

async function saveThread(threadId, author, title) {
    await sequelize.sync();
    await Thread.upsert({
        id: threadId,
        author,
        title
    });
}

module.exports = {
    Thread,
    saveThread
};