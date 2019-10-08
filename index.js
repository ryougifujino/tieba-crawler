const threadsCrawler = require('./data/threads-crawler');
const threadsCrawlerPro = require('./data/threads-crawler-pro');

const stdin = process.openStdin();
stdin.addListener("data", async function (d) {
    let args = d.toString().trim().split(/[ ,|/\\]/);
    if (args.length !== 2 && !(args.length === 3 && args[2] === 'pro')) {
        console.error("Error input!");
        return;
    }
    if (args.length === 2) {
        threadsCrawler.crawl(...args);
    } else {
        await threadsCrawlerPro.crawl(...args);
    }
});
