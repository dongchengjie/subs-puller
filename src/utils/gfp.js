import axios from 'axios';
import { base64Encode } from './string.js';
import { logger } from './logger.js';
/**
 * 推送文件到Github仓库
 * @param {string} repository 仓库（包含owner和repo）
 * @param {string} path 文件路径
 * @param {string} branch 分支
 * @param {string} token 仓库token
 * @param {string} content 文件内容
 * @param {string} message 提交信息
 * @param {string} committer 提交者名称
 * @param {string} committerEmail 提交者邮箱
 */
export const push = async (repository, path, branch, token, content, message, committer, committerEmail) => {
  const [owner, repo] = repository.split('/');
  const _axios = createAxiosInstance(owner, repo, path, branch, token);
  // 获取文件SHA
  const sha = await getSHA(_axios);
  // 推送文件
  return commit(_axios, sha, content, message, committer, committerEmail);
};

const restAPI = (owner, repo, path, branch) =>
  'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path + (branch ? '?ref=' + branch : '');

const createAxiosInstance = (owner, repo, path, branch, token) => {
  return axios.create({
    baseURL: restAPI(owner, repo, path, branch),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

const getSHA = async _axios => {
  return _axios({ method: 'get' })
    .then(res => res.data.sha)
    .catch(err => {
      let message = err?.toString();
      if (err?.response?.status === 404) {
        message = 'remote file does not exist and a new file will be added.';
      } else if (err?.response?.data) {
        message = err.response.data.message;
      }
      logger.error(`Error getting file SHA: ${message}`);
    });
};

const commit = async (_axios, sha, content, message, committer, committerEmail) => {
  const requestBody = JSON.stringify({
    sha: sha ? sha : '',
    message: message ? message : "Added/Updated by Github Action 'subs-puller'",
    committer: {
      name: committer ? committer : 'subs-puller',
      email: committerEmail ? committerEmail : 'github@actions.com'
    },
    content: base64Encode(content)
  });
  return _axios({ method: 'put', data: requestBody })
    .then(res => {
      if (res.status === 200) {
        logger.warning(`file '${res.data.content.name}' updated.`);
      } else if (res.status === 201) {
        logger.warning(`file '${res.data.content.name}' added.`);
      }
    })
    .catch(err => {
      let message = err?.toString();
      if (err?.response?.data) {
        message = err.response.data.message;
      }
      logger.error(`Error getting file SHA: ${message}`);
    });
};
