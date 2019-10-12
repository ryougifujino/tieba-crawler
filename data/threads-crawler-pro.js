const {flatMap} = require('lodash');
const tbApis = require('./tb-apis');
const logger = require('../util/logger');
const config = require('./config');
const {saveThread, findAllThreadIds} = require('./dao/thread');
const {savePosts} = require('./dao/post');
const {RequestQueue} = require('../util/request-queue');

const STEP = 50;
const LIMIT = config.LIMIT_CRAWL_ONCE;
const FIRST_LIMIT = config.LIMIT_FIRST_CRAWL;
const SEPARATOR = ',\n';

let lock = false;

let timeStart;

async function _crawl(barName, from, to) {
    if (lock) {
        logger.error('Crawler has been launched, please wait!');
        return;
    }

    lock = true;
    if (!to) {
        [to, from] = [from, 0];
        timeStart = new Date();
        logger.log(`[${barName}] --------------------START--------------------`);
    }
    // the last page
    if (from >= to) {
        logger.log(`[${barName}] Time Consuming: ${(new Date() - timeStart) / 1000} seconds.`);
        logger.log(`[${barName}] ---------------------END---------------------`);
        await crawlThreadsContent(barName);
        lock = false;
        return;
    }

    // requests in once
    let pageThreadsPromiseList = [];
    const end = Math.min(from + (from === 0 ? FIRST_LIMIT : LIMIT), to);
    for (let i = from; i < end; i++) {
        pageThreadsPromiseList.push(tbApis.getPageThreads(barName, STEP * i));
    }

    const persistInOrder = () => {
        Promise.all(pageThreadsPromiseList).then(pageThreadsList => {
            // check empty result and refresh
            let indexListOfEmptyPageThreads = [];
            pageThreadsList.forEach((pageThreads, index) => {
                if (!pageThreads.length) {
                    indexListOfEmptyPageThreads.push(from + index);
                    refreshPageThreadsPromise(index);
                }
            });

            if (indexListOfEmptyPageThreads.length) {
                // has empty result, retry
                logger.log(`[${barName}] PageNumber∈{${indexListOfEmptyPageThreads.join(',')}} are empty, retrying...`);
                persistInOrder();
            } else {
                // all result are ok
                flatMap(pageThreadsList, pageThreads => pageThreads)
                    .forEach(async thread => {
                        try {
                            await saveThread(thread.thread_id, barName, thread.username, thread.nickname, thread.title);
                        } catch (e) {
                            // unlikely to happen
                            logger.error("threads-crawler-pro#_crawl#persistInOrder@saveThread", e);
                        }
                    });
                logger.log(`[${barName}] PageNumber∈[${from + 1}, ${end}] finished.`);
                lock = false;
                _crawl(barName, end, to);
            }
        }).catch(reason => {
            logger.error("threads-crawler-pro#_crawl#persistInOrder@catch", reason);

            // replace rejected items with new items
            pageThreadsPromiseList.forEach((pageThreadsPromise, index) =>
                pageThreadsPromise.catch(() => refreshPageThreadsPromise(index)));
            // retry
            logger.log(`[${barName}] PageNumber∈[${from + 1}, ${end}] retrying...`);
            persistInOrder();
        });
    };
    persistInOrder();

    function refreshPageThreadsPromise(index) {
        pageThreadsPromiseList[index] = tbApis.getPageThreads(barName, STEP * (from + index));
    }
}

async function crawl(barName, endPage) {
    await _crawl(barName, endPage);
}

async function crawlThreadsContent(barName) {
    const threadIds = await findAllThreadIds(barName);
    // TODO: call resolve
    return new Promise((resolve, reject) => {
        const pagePostsQueue = new RequestQueue(50, pagePosts => {
            savePosts(pagePosts.map(pagePost => {
                pagePost.id = pagePost.post_id;
                delete pagePost.post_id;
                return pagePost;
            }));
        }, 'PAGE_POSTS_QUEUE');

        const maxPageNumberQueue = new RequestQueue(50, (maxPageNumber, threadId) => {
            for (let pageNumber = 1; pageNumber <= maxPageNumber; pageNumber++) {
                pagePostsQueue.push(() => tbApis.getPagePosts(barName, threadId, pageNumber));
            }
        }, 'MAX_PAGE_NUMBER_QUEUE');
        threadIds.forEach(threadId => maxPageNumberQueue.push(
            () => tbApis.getThreadMaxPageNumber(barName, threadId), threadId));
        maxPageNumberQueue.finally(() => {
            console.log('maxPageNumberQueue end')
        });
        pagePostsQueue.finally(() => {
            console.log('pagePostsQueue end')
        });
    });
}

module.exports = {
    crawl
};
