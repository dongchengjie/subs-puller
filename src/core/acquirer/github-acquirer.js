import { getOctokit } from '@actions/github';
import logger from '../../utils/logger.js';
import { fetchContents } from '../../utils/fetcher.js';

export default {
  acquire: async (item, token) => {
    try {
      if (item.urls && item.urls.length > 0) {
        // 获取owner和repo
        const [owner, repo] = item.urls[0].replace(/.*github.com\/(.*)$/, '$1').split('/');
        const octokit = getOctokit(token);
        // 计算查询范围(默认一周)
        const since = new Date(new Date() - (item?.options?.span || 604800000)).toISOString();
        const exts = (item?.options?.exts?.split(',') || []).filter(Boolean).map(ext => ext.trim());
        // 查询新增 或 修改的文件的raw_url地址
        const urls = await getRecentFileUrls(octokit, owner, repo, since, filename =>
          exts.length > 0 ? exts.some(ext => filename.endsWith(ext)) : true
        );
        // 下载文件内容
        const timeout = item.timeout ?? 10000;
        const headers = item.headers;
        const result = await fetchContents(urls, timeout, headers, (successes, failures) =>
          logger.info(`${item.id} fetch completed, ${successes} successes and ${failures} failures`)
        );
        return [item, result];
      }
    } catch (err) {
      logger.error(`Error acquiring ${item.id}: ${err.message}`);
      return [item, []];
    }
  }
};

async function getRecentFileUrls(octokit, owner, repo, since, filter) {
  try {
    // 获取最近的commit记录
    const commits = await listCommits(octokit, owner, repo, since);
    let commitDetails = (
      await Promise.all(commits.map(async commit => await getCommits(octokit, owner, repo, commit.sha)))
    ).reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
    // 按照提交顺序逆序
    commitDetails = commitDetails.sort((d1, d2) => {
      const t1 = new Date(d1.commit.author.date || d1.commit.committer.date).getTime();
      const t2 = new Date(d2.commit.author.date || d2.commit.committer.date).getTime();
      return t2 - t1;
    });
    // 计算每个文件见最后一次更新
    let activeFiles = [];
    let rawUrls = [];
    for (let detail of commitDetails) {
      const files = detail.files;
      for (let file of files) {
        if ((file.status === 'added' || file.status === 'modified') && !activeFiles.includes(file.filename)) {
          if (filter && !filter(file.filename)) {
            continue;
          }
          activeFiles.push(file.filename);
          rawUrls.push(file.raw_url);
        }
      }
    }
    return rawUrls;
  } catch (err) {
    return [];
  }
}

// 获取commit记录
const listCommits = async (octokit, owner, repo, since) => {
  return await getAllPages('listCommits', 100, index =>
    octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo,
      since: since,
      per_page: 100,
      page: index
    })
  );
};

// 获取commit的文件
const getCommits = async (octokit, owner, repo, commitSha) => {
  return await getAllPages('getCommits', 100, index =>
    octokit.rest.repos.getCommit({
      owner: owner,
      repo: repo,
      ref: commitSha
    })
  );
};

// 查询所有页码数据
export const getAllPages = async (name, per_page, provider) => {
  let records = [];
  try {
    let flag = true;
    let index = 1;
    while (flag) {
      const res = await provider(index);
      records = records.concat(res.data);
      flag = res.data.length === per_page;
      index += 1;
    }
  } catch (error) {
    logger.error(`Error getting page data '${name}': ${error.message}`);
  }
  return records;
};
