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

function log(...messages) {
    console.log(...messages);
    _(FLAG_LOG, ...messages);
}

function error(...messages) {
    console.error(...messages);
    _(FLAG_ERROR, ...messages);
}

module.exports = {
    log,
    error
};
