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

module.exports = {
    Thread
};