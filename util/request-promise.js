const http = require('http');
const https = require('https');

const PROTOCOL_HTTP = "http";
const PROTOCOL_HTTPS = "https";

const REQUEST = {http, https};


function getProtocol(url) {
    url = PROTOCOL_HTTP + encodeURI(url);
    return new Promise((resolve, reject) => {
        http.get(url, response => {
            let {statusCode} = response;
            switch (statusCode) {
                case 200:
                    resolve(PROTOCOL_HTTP);
                    break;
                case 301:
                    resolve(PROTOCOL_HTTPS);
                    break;
                default:
                    reject(new Error(`Request failed, status code: ${statusCode}`));
            }
        }).on('error', err => reject(err));
    });
}

function get(protocol, url) {
    url = protocol + encodeURI(url);
    return new Promise((resolve, reject) => {
        REQUEST[protocol]['get'](url, response => {
            let body = [];
            response.on('data', chunk => body.push(chunk));
            response.on('end', () => resolve(Buffer.concat(body).toString()))
                .on('error', err => reject(err));
        }).on('error', err => reject(err));
    });
}

module.exports = {
    get,
    getProtocol
};
