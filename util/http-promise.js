const http = require('http');

function get(url) {
    url = encodeURI(url);
    return new Promise((resolve, reject) => {
        http.get(url, response => {
            let body = [];
            response.on('data', chunk => body.push(chunk));
            response.on('end', () => resolve(Buffer.concat(body).toString()))
                .on('error', err => reject(err));
        });
    });
}

module.exports = {
    get
};