/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import orval from 'orval';

function wait(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function fetchRetry(url, delay, tries, fetchOptions = {}) {
    function onError(err) {
        const triesLeft = tries - 1;
        if (!triesLeft) {
            throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
    }
    return fetch(url, fetchOptions).catch(onError);
}

fetchRetry('http://backend:8888/data/generate_openapi_json', 1000, 100)
    .then((res) => res.json())
    .then((res) => {
	    writeFileSync("./api.json", JSON.stringify(res));
    });
//     .then(() => {
// 	    orval('../orval.config.js')
//     });