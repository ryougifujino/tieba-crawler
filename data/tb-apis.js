const {JSDOM} = require('jsdom');
const request = require('../util/request-promise.js');
const {timestampToReadable} = require('../util/date-utils');

const RE_PADDED_DATE = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
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
        const title = titleNode.getAttribute('title');
        const thread_id = titleNode.getAttribute('href').slice(3);

        const authorNode = headNode.querySelector('.pull_right > span');
        const nickname = authorNode.getAttribute('title').substring(6);
        const usernameNode = authorNode.querySelector('.frs-author-name-wrap > a');
        let username = null;
        if (usernameNode) {
            try {
                const usernameJson = JSON.parse(usernameNode.getAttribute('data-field'));
                username = usernameJson['un'];
            } catch (e) {
                console.error(e);
            }
        }

        threads.push({thread_id, username, nickname, title});
        return threads;
    }, []);
};

const getThreadMaxPageNumber = async (barName, threadId) => {
    const protocol = barProtocols[barName];
    if (!protocol) {
        return new Error('unknown protocol of the provided bar name');
    }
    const body = await request.get(protocol, `://tieba.baidu.com/p/${threadId}?pn=1`);
    // the thread was deleted
    if (body === '') {
        return 0;
    }
    const {window: {document}} = new JSDOM(body);
    const pageNumberNode = document.querySelector('.p_thread .l_thread_info .l_posts_num > .l_reply_num span:last-child');
    const pageNumberString = pageNumberNode.textContent || '0';
    return parseInt(pageNumberString);
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

        let created_time = null;
        if (basic.content.date) {
            created_time = basic.content.date;
        } else {
            const postTailNode = post.querySelector('.d_post_content_main .core_reply .core_reply_tail');
            const createdTimeMatcher = RE_PADDED_DATE.exec(postTailNode.textContent);
            created_time = createdTimeMatcher && createdTimeMatcher[0];
        }

        posts.push({
            thread_id: threadId,
            post_id,
            nickname,
            username,
            floor_number,
            comment_total,
            content,
            created_time
        });
        return posts;
    }, []);
};

const getPageCommentMap = async (threadId, page) => {
    const t = new Date().getTime();
    const result = await request.get('https', `://tieba.baidu.com/p/totalComment?t=${t}&tid=${threadId}&pn=${page}`);
    const {data, errmsg} = JSON.parse(result);
    if (!data) {
        throw new Error(errmsg);
    }
    const {comment_list: commentMap, user_list: userMap} = data;
    const pageCommentMap = {};
    Object.keys(commentMap).forEach(postId => {
        const comments = commentMap[postId].comment_info;
        pageCommentMap[postId] = comments.map(comment => ({
            comment_id: comment.comment_id,
            content: comment.content,
            created_time: timestampToReadable(comment.now_time),
            post_id: postId,
            thread_id: comment.thread_id,
            username: comment.username,
            nickname: userMap[comment.user_id].display_name
        }));
    });
    return pageCommentMap;
};

const getComments = async (threadId, postId, page) => {
    const t = new Date().getTime();
    const result = await request.get('https', `://tieba.baidu.com/p/comment?tid=${threadId}&pid=${postId}&pn=${page}&t=${t}`);
    const commentNodes = [...new JSDOM(result).window.document.querySelectorAll('.lzl_single_post.j_lzl_s_p')];
    return commentNodes.map(commentNode => {
        const commentIdNode = commentNode.querySelector('a');
        const comment_id = commentIdNode ? commentIdNode.getAttribute('name') : null;
        const fromNode = commentNode.querySelector('.lzl_cnt > a');
        const username = fromNode.getAttribute('username');
        const nickname = fromNode.textContent;
        const contentNode = commentNode.querySelector('.lzl_cnt .lzl_content_main');
        const content = (contentNode.textContent).trim();
        const created_time = commentNode.querySelector('.lzl_cnt .lzl_content_reply .lzl_time').textContent;
        return {
            comment_id,
            content,
            created_time,
            post_id: postId,
            thread_id: threadId,
            username,
            nickname
        };
    });
};

module.exports = {
    getPageThreads,
    getThreadMaxPageNumber,
    getPagePosts,
    getPageCommentMap,
    getComments
};
