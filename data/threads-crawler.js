const tbApis = require('./tb-apis');
const logger = require('../util/logger');
const fs = require('fs');

const STEP = 50;
const LIMIT = 20;
const OUTPUT_DIR = `output/result/`;
const SEPARATOR = ',\n';

let lock = false;

function scrawl(barName, from, to) {
    !to && ({to, from} = {to: from, from: 0});
    if (lock) {
        logger.error('Crawler has launched, please wait!');
        return;
    }

    lock = true;
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    const outputFilePath = `${OUTPUT_DIR + barName}.txt`;
    if (from === 0 && fs.existsSync(outputFilePath)) {
        fs.unlink(outputFilePath, (err) => err && logger.error(err));
    }
    if (from >= to) return;
    let allThreads = [];
    const end = Math.min(from + LIMIT, to);
    for (let i = from; i < end; i++) {
        allThreads.push(tbApis.getThreadList(barName, STEP * i));
    }

    Promise.all(allThreads).then(allThreads => {
        allThreads.forEach(pageThreads => {
            fs.appendFileSync(outputFilePath,
                pageThreads.map(thread => JSON.stringify(thread)).join(SEPARATOR) + SEPARATOR)
        });
        logger.log(`[${barName}] index ∈ [${from}, ${end}) finished.`);
        lock = false;
        scrawl(barName, end, to);
    }).catch(reason => {
        logger.error(reason);
    });
}

module.exports = {
    scrawl
};
