/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const OpenAPI = require('openapi-typescript-codegen');
const fetch = require('node-fetch');

// async function fetchUntilSucceeded() {
//   let success = false;
//   while(!success) {
//     try {
//       let result = await fetch('http://localhost/data/generate_openapi_json');
//       success = true;
//       return result;
//     } catch {
//       setTimeout();
//     }
//   }
// }

function wait(delay){
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function fetchRetry(url, delay, tries, fetchOptions = {}) {
  function onError(err){
    triesLeft = tries - 1;
    if(!triesLeft){
      throw err;
    }
    return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
  }
  return fetch(url,fetchOptions).catch(onError);
}


fetchRetry('http://backend:8888/data/generate_openapi_json', 1000, 100)
  .then((res) => res.json())
  .then((res) => {

    OpenAPI.generate({
      input: res,
      output: './src/api'
    });
  });