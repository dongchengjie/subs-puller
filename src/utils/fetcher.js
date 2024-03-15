import axios from 'axios';
import logger from './logger.js';
/**
 *
 * @param {*} urls url列表
 * @param {*} timeout http请求超时
 * @param {*} headers http请求头
 * @returns
 */
export const fetchContents = async (urls, timeout, headers, fallback) => {
  const contents = [];
  const _axios = axios.create({
    timeout,
    headers
  });
  let successes = 0;
  let failures = 0;
  return Promise.all(
    urls.map(url =>
      new Promise((resolve, reject) => _axios.get(url).then(resolve).catch(reject))
        .then(res => {
          successes++;
          contents.push(res.data);
        })
        .catch(err => {
          failures++;
          logger.error(`Error fetching ${url}: ${err.message}`);
        })
    )
  ).then(() => {
    fallback && fallback(successes, failures);
    return contents;
  });
};
