const {JSDOM} = require('jsdom');
const request = require('../util/request-promise.js');

const barProtocols = {};

const getPageThreads = async (barName, page) => {
    let protocol = barProtocols[barName];
    if (!protocol) {
        protocol = await request.getProtocol(`://tieba.baidu.com/f?kw=${barName}&ie=utf-8`);
        barProtocols[barName] = protocol;
    }
    const body = await request.get(protocol, `://tieba.baidu.com/f?kw=${barName}&ie=utf-8&pn=${page}`);
    const {window: {document}} = new JSDOM(body);
    const threads = [...document.querySelectorAll('#content_leftList .j_thread_list.clearfix')];

    return threads.reduce((threads, thread) => {
        const headNode = thread.querySelector('.threadlist_lz.clearfix');

        const titleNode = headNode.querySelector('.j_th_tit a');
        let title = titleNode.getAttribute('title');
        let thread_id = titleNode.getAttribute('href').slice(3);

        const authorNode = headNode.querySelector('.pull_right > span');
        let author = authorNode.getAttribute('title').substring(6);

        threads.push({thread_id, author, title});
        return threads;
    }, []);
};

const getPagePosts = async (barName, threadId, page) => {
    const protocol = barProtocols[barName];
    if (!protocol) {
        return new Error('unknown protocol of the provided bar name');
    }
    const body = await request.get(protocol, `://tieba.baidu.com/p/${threadId}?pn=${page}`);
    const {window: {document}} = new JSDOM(body);
    const posts = [...document.querySelectorAll('.pb_content .left_section .p_postlist > div')];

    return posts.reduce((posts, post) => {
        let basic = {};
        try {
            basic = JSON.parse(post.getAttribute('data-field'))
        } catch (e) {
            console.error("post data-field is not a JSON string");
        }

        const nickname = basic.author.user_name;
        const username = basic.author.user_nickname ? basic.author.user_nickname : nickname;

        const post_id = basic.content.post_id;
        const floor_number = basic.content.post_no;
        const comment_total = basic.content.comment_num;

        const contentNode = post.querySelector('.d_post_content_main .p_content > cc .d_post_content.j_d_post_content');
        const content = (contentNode.innerHTML || '').trim();

        const postTailNodes = post.querySelectorAll('.d_post_content_main .core_reply.j_lzl_wrapper .post-tail-wrap > .tail-info') || [];
        const created_time = ([...postTailNodes].pop() || {}).textContent;

        posts.push({
            nickname,
            username,
            post_id,
            floor_number,
            comment_total,
            content,
            created_time
        });
        return posts;
    }, []);
};

barProtocols['冒险岛'] = 'https';

!async function () {
    const posts = await getPagePosts('冒险岛', '5750286932', 1);
    console.log(posts);
}();

module.exports = {
    getPageThreads
};
