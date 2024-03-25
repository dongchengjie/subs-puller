import axios from 'axios';
import dispatcher from './src/core/dispatcher.js';
import dotenv from 'dotenv';
import { currentDir } from './src/utils/path.js';
import { fetchContents } from './src/utils/fetcher.js';
import { getInput } from '@actions/core';
import { load } from 'js-yaml';
import logger from './src/utils/logger.js';
import { push } from './src/utils/gfp.js';
import { readFileSync } from 'fs';
import { validateSchema } from './src/utils/schema/schema.js';

const getActionInput = names => {
  dotenv.config();
  return names.map(name => process.env[name] || getInput(name));
};

(async () => {
  try {
    // 接收Github Action参数
    let [repository, branch, token, config, merged] = getActionInput([
      'repository',
      'branch',
      'token',
      'config',
      'merged'
    ]);
    repository = repository || process.env['GITHUB_REPOSITORY'];
    branch = branch || process.env['GITHUB_REF_NAME'] || 'main';

    // 读取配置、schema文件
    const configContent = process.env['dev'] ? readFileSync('./example.yaml') : (await axios.get(config)).data;
    const schemaContent = readFileSync(currentDir() + '/src/utils/schema/subs-puller.json', 'utf8');

    // 使用schema校验配置文件格式
    const jsonObject = load(configContent);
    if (validateSchema(schemaContent, jsonObject, errors => logger.error(errors))) {
      // 拉取订阅文件内容
      logger.info('Fetching subscribe files...');
      const contents = new Map(
        (
          await Promise.all(
            jsonObject.data.map(async item => {
              const timeout = item.timeout ?? 10000;
              const headers = item.headers;
              const result = await fetchContents(item.urls, timeout, headers, (successes, failures) =>
                logger.info(`${item.id} fetch completed, ${successes} successes and ${failures} failures`)
              );
              return [item, result];
            })
          )
        ).filter(([_item, result]) => {
          return result && result.length > 0;
        })
      );
      logger.info('Subscribe files fetched.');

      // 合并、转换、后置处理
      let resultMap = await Promise.all(
        Array.from(contents.entries()).map(async ([item, contents]) => {
          // 合并
          logger.info(`Combining ${item.id}...`);
          const combinedContent = await dispatcher.getCombiner(item.source, item.target).combine(contents, item);
          logger.info(`${item.id} combined.`);
          if (!combinedContent) return null;

          // 转换
          logger.info(`Converting ${item.id}...`);
          const convertedContent = await dispatcher
            .getConverter(item.source, item.target)
            .convert(combinedContent, item);
          logger.info(`${item.id} converted.`);
          if (!convertedContent) return null;

          // 结果处理
          logger.info(`Processing ${item.id}...`);
          const processedContent = await dispatcher
            .getResultProcessor(item.source, item.target)
            .process(convertedContent, item);
          logger.info(`${item.id} processed.`);
          return processedContent != null ? [item, processedContent] : null;
        })
      );
      resultMap = new Map(resultMap.filter(Boolean).filter(([item, result]) => result));

      // 生成合并proxy-provider文件
      if (merged) {
        const providers = jsonObject.data.map(item => [
          item.id,
          `https://raw.githubusercontent.com/${repository}/${branch}/` + item.output
        ]);
        const providersTemplate = readFileSync(currentDir() + '/src/template/providers.yaml', 'utf8');
        const providerList = providers
          .map(
            ([key, value]) =>
              '  ' + key + ":\n    type: http\n    url: '" + value + "'\n    path: ./providers/" + key + '.yaml'
          )
          .join('\n');
        const mergedContent = providersTemplate.replace('proxy-providers: []', 'proxy-providers: \n' + providerList);
        resultMap.set({ output: merged }, mergedContent);
      }

      // 推送到仓库
      const files = Array.from(resultMap.entries())
        .map(([key, value]) => (value ? { path: key.output, content: value } : null))
        .filter(Boolean);
      if (files && files.length > 0) {
        await push(files, repository, branch, token);
      }
    }
  } catch (err) {
    logger.error(err);
  }
})();
