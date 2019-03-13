const fs = require('fs');

const OUTPUT_DIR = "output/logs/";
const FLAG_LOG = "LOG";
const FLAG_ERROR = "ERROR";

function makeLogName(logFlag) {
    let today = new Date();
    return `${logFlag}_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function _(logFlag, ...messages) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    messages = messages.reduce((messagesStr, message, index) => {
        messagesStr += JSON.stringify(message);
        return messagesStr + (index === messages.length - 1 ? '' : ' ');
    }, "");
    messages = `${new Date().toLocaleString()} - ${messages}\n`;
    fs.appendFileSync(`${OUTPUT_DIR + makeLogName(logFlag)}.log`, messages);
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
