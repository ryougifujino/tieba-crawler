const tbApis = require('./tb-apis');
const logger = require('../util/logger');
const fs = require('fs');
const config = require('./config');

const STEP = 50;
const LIMIT = config.LIMIT_CRAWL_ONCE;
const FIRST_LIMIT = config.LIMIT_FIRST_CRAWL;
const OUTPUT_DIR = `output/result/`;
const SEPARATOR = ',\n';

let lock = false;

let timeStart;

function _crawl(barName, from, to) {
    if (lock) {
        logger.error('Crawler has been launched, please wait!');
        return;
    }

    lock = true;
    if (!to) {
        ({to, from} = {to: from, from: 0});
        timeStart = new Date();
        logger.log(`[${barName}] --------------------START--------------------`);
    }
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    const outputFilePath = `${OUTPUT_DIR + barName}.txt`;
    if (from === 0 && fs.existsSync(outputFilePath)) {
        fs.unlink(outputFilePath, (err) => err && logger.error("thread-crawler#_crawl@unlink", err));
    }
    // the last page
    if (from >= to) {
        logger.log(`[${barName}] Time Consuming: ${(new Date() - timeStart) / 1000} seconds.`);
        logger.log(`[${barName}] ---------------------END---------------------`);
        lock = false;
        return;
    }
    let pageThreadsPromiseList = [];
    const end = Math.min(from + (from === 0 ? FIRST_LIMIT : LIMIT), to);
    for (let i = from; i < end; i++) {
        try {
            pageThreadsPromiseList.push(tbApis.getPageThreads(barName, STEP * i));
        } catch (e) {
            logger.error("threads-crawler#_crawl@getPageThreads", e);
        }
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
                pageThreadsList.forEach(pageThreads => {
                    let pageContent = pageThreads.map(thread => JSON.stringify(thread)).join(SEPARATOR) + SEPARATOR;
                    fs.appendFileSync(outputFilePath, pageContent);
                });
                logger.log(`[${barName}] PageNumber∈[${from + 1}, ${end}] finished.`);
                lock = false;
                _crawl(barName, end, to);
            }
        }).catch(reason => {
            logger.error("threads-crawler#_crawl#persistInOrder@catch", reason);

            // replace rejected items with new items
            pageThreadsPromiseList.forEach((pageThreadsPromise, index) => {
                pageThreadsPromise.catch(() => refreshPageThreadsPromise(index));
            });
            // retry
            logger.log(`[${barName}] PageNumber∈[${from + 1}, ${end}] retrying...`);
            persistInOrder();
        });

        function refreshPageThreadsPromise(index) {
            pageThreadsPromiseList[index] = tbApis.getPageThreads(barName, STEP * (from + index));
        }
    };
    persistInOrder();
}

function crawl(barName, endPage) {
    _crawl(barName, endPage);
}

module.exports = {
    crawl
};
