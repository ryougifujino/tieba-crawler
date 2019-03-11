const tbApis = require('./tb-apis');
const logger = require('../util/logger');
const fs = require('fs');

const STEP = 50;
const LIMIT = 20;
const FIRST_LIMIT = 5;
const OUTPUT_DIR = `output/result/`;
const SEPARATOR = ',\n';

let lock = false;

let timeStart;

function _scrawl(barName, from, to) {
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
        fs.unlink(outputFilePath, (err) => err && logger.error("thread-crawler#_scrawl@unlink", err));
    }
    // the last page
    if (from >= to) {
        logger.log(`[${barName}] Time Consuming: ${(new Date() - timeStart) / 1000} seconds.`);
        logger.log(`[${barName}] ---------------------END---------------------`);
        lock = false;
        return;
    }
    let allThreads = [];
    const end = Math.min(from + (from === 0 ? FIRST_LIMIT : LIMIT), to);
    for (let i = from; i < end; i++) {
        allThreads.push(tbApis.getThreadList(barName, STEP * i));
    }

    Promise.all(allThreads).then(allThreads => {
        allThreads.forEach(pageThreads => {
            fs.appendFileSync(outputFilePath,
                pageThreads.map(thread => JSON.stringify(thread)).join(SEPARATOR) + SEPARATOR)
        });
        logger.log(`[${barName}] PageNumber∈[${from + 1}, ${end}] finished.`);
        lock = false;
        _scrawl(barName, end, to);
    }).catch(reason => {
        logger.error("threads-crawler#_scrawl@catch", reason);
        lock = false;
    });
}

function scrawl(barName, endPage) {
    _scrawl(barName, endPage);
}

module.exports = {
    scrawl
};
