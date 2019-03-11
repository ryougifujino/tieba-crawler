const fs = require('fs');

const OUTPUT_DIR = "output/logs/";
const FLAG_LOG = "LOG";
const FLAG_ERROR = "ERROR";

function makeLogName() {
    let today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function _(flag, ...messages) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    messages = messages.reduce((messagesStr, message, index) => {
        messagesStr += JSON.stringify(message);
        return messagesStr + (index === messages.length - 1 ? '' : ' ');
    }, "");
    messages = `${new Date().toLocaleString()} - ${messages}\n`;
    let fileName = `${flag}_${makeLogName()}`;
    fs.appendFileSync(`${OUTPUT_DIR + fileName}.log`, messages);
}

function log(message) {
    console.log(message);
    _(FLAG_LOG, message);
}

function error(message) {
    console.log(message);
    _(FLAG_ERROR, message);
}

module.exports = {
    log,
    error
};