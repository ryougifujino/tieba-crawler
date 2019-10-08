const path = require('path');
const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '..', 'tieba.sqlite'),
    define: {
        timestamps: false
    },
    logging: false
});

module.exports = {
    sequelize
};