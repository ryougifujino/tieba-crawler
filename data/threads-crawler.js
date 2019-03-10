const tbApis = require('./tb-apis');
const fs = require('fs');

const STEP = 50;
const LIMIT = 20;
const OUTPUT_DIR = `result/`;
const SEPARATOR = ',\n';

let lock = false;

function scrawl(barName, from, to) {
    !to && ({to, from} = {to: from, from: 0});
    if (lock) {
        console.error('Crawler has launched, please wait!');
        return;
    }

    lock = true;
    const outputFilePath = `${OUTPUT_DIR + barName}.txt`;
    if (from === 0) {
        fs.unlinkSync(outputFilePath);
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
        console.log(`Index ∈ [${from}, ${end}) finished.`);
        lock = false;
        scrawl(barName, end, to);
    }).catch(reason => {
        console.error(reason);
    });
}

module.exports = {
    scrawl
};