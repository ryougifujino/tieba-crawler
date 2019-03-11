const threadsCrawler = require('./data/threads-crawler');

const stdin = process.openStdin();
stdin.addListener("data", function (d) {
    let args = d.toString().trim().split(/[ ,|/\\]/);
    if (args.length !== 2) {
        console.error("Error input!");
        return;
    }
    threadsCrawler.scrawl(...args);
});
