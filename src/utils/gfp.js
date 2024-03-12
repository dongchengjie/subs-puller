import { getOctokit } from '@actions/github';
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
export const push = async (files, repository, branch, token, message, committer, committerEmail) => {
  const [owner, repo] = repository.split('/');
  branch = branch || process.env['GITHUB_REF_NAME'] || 'main';
  const octokit = getOctokit(token);
  // 推送文件
  return await commitFiles(files, octokit, owner, repo, branch, message);
};

const commitFiles = async ({
  files,
  octokit,
  owner,
  repo,
  branch,
  message = "Added/Updated by Github Action 'subs-puller'",
  committer = 'subs-puller',
  committerEmail = 'github@actions.com'
}) => {
  try {
    const branchRef = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const branchTree = await octokit.rest.git
      .getTree({
        owner,
        repo,
        tree_sha: branchRef.data.object.sha,
        recursive: true
      })
      .catch(error => {
        console.error('Error getting tree:', error.message);
        throw error;
      });

    const newTree = await octokit.rest.git
      .createTree({
        owner,
        repo,
        tree: files.map(file => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          content: file.content
        })),
        base_tree: branchTree.data.sha
      })
      .catch(error => {
        console.error('Error creating tree:', error.message);
        throw error;
      });

    const newCommit = await octokit.rest.git
      .createCommit({
        owner,
        repo,
        message,
        author: { name: committer, email: committerEmail },
        tree: newTree.data.sha,
        parents: [branchRef.data.object.sha]
      })
      .catch(error => {
        console.error('Error creating commit:', error.message);
        throw error;
      });

    await octokit.rest.git
      .updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.data.sha
      })
      .catch(error => {
        console.error('Error updating ref:', error.message);
        throw error;
      });
  } catch (error) {
    console.error('Error committing files:', error.message);
  }
};
