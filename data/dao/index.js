const path = require('path');
const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve('..', 'tieba.sqlite'),
    define: {
        timestamps: false
    }
});

module.exports = {
    sequelize
};