const {JSDOM} = require('jsdom');
const request = require('../util/request-promise.js');

let barProtocols = {};

const getThreadList = async (barName, page) => {
    let protocol = barProtocols[barName];
    if (!protocol) {
        protocol = await request.getProtocol(`://tieba.baidu.com/f?kw=${barName}&ie=utf-8`);
        barProtocols[barName] = protocol;
    }
    const body = await request.get(protocol, `://tieba.baidu.com/f?kw=${barName}&ie=utf-8&pn=${page}`);
    let {window: {document}} = new JSDOM(body);
    let threads = [...document.querySelectorAll('#content_leftList .j_thread_list.clearfix')];

    return threads.reduce((threads, thread) => {
        const headDom = thread.querySelector('.threadlist_lz.clearfix');

        const titleDom = headDom.querySelector('.j_th_tit a');
        let title = titleDom.getAttribute('title');
        let link = titleDom.getAttribute('href');

        const authorDom = headDom.querySelector('.pull_right > span');
        let author = authorDom.getAttribute('title').substring(6);

        threads.push({link, author, title});
        return threads;
    }, []);
};

module.exports = {
    getThreadList
};
