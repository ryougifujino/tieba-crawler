const {sequelize} = require('.');
const {Model, DataTypes} = require('sequelize');

class Post extends Model {
}

Post.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    thread_id: DataTypes.STRING,
    nickname: DataTypes.STRING,
    username: DataTypes.STRING,
    floor_number: DataTypes.INTEGER,
    comment_total: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    created_time: DataTypes.DATE
}, {sequelize, modelName: 'post'});

async function savePosts(posts) {
    await sequelize.sync();
    try {
        await Post.bulkCreate(posts, {
            updateOnDuplicate: ['thread_id', 'nickname', 'username', 'comment_total']
        });
    } catch (e) {
        console.error(e)
    }

}

module.exports = {
    savePosts
};
