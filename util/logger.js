const fs = require('fs');

const OUTPUT_DIR = "output/logs/";
const FLAG_LOG = "LOG";
const FLAG_ERROR = "ERROR";

function makeLogName() {
    let today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function _(flag, message) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    let fileName = `${flag}_${makeLogName()}`;
    message = new Date().toLocaleString() + ' - ' + JSON.stringify(message) + '\n';
    fs.appendFileSync(`${OUTPUT_DIR + fileName}.log`, message);
}

function log(message) {
    console.log(message);
    _(FLAG_LOG, message);
}

function error(message) {
    _(FLAG_ERROR, message);
}

module.exports = {
    log,
    error
};
