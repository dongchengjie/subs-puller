import axios from 'axios';
import dotenv from 'dotenv';
import { currentDir } from './src/utils/path.js';
import { fetchContents } from './src/utils/fetcher.js';
import { getCombiner, getConverter } from './src/converter/dispatcher.js';
import { getInput } from '@actions/core';
import { load } from 'js-yaml';
import { logger } from './src/utils/logger.js';
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
    const [repository, branch, token, config] = getActionInput(['repository', 'branch', 'token', 'config']);

    // 读取配置、schema文件
    const configContent = (await axios.get(config)).data;
    const schemaContent = readFileSync(currentDir() + '/src/utils/schema/subs-puller.json', 'utf8');

    // 使用schema校验配置文件格式
    const jsonObject = load(configContent);
    if (validateSchema(schemaContent, jsonObject, errors => logger.error(errors))) {
      // 异步拉取订阅文件
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

      // 合并订阅文件内容
      const combined = (
        await Promise.all(
          Array.from(contents.entries()).map(async ([key, value]) => {
            const content = await getCombiner(key.source)(value);
            return content && content.length > 0 ? [key, content] : null;
          })
        )
      ).filter(Boolean);

      // 转换订阅类型
      const converted = new Map();
      await Promise.all(
        Array.from(combined, async ([key, value]) => {
          converted.set(key, await getConverter(key.source, key.target)(value, key.source, key.target));
        })
      );

      // 推送到仓库
      for (let [key, value] of converted) {
        if (value) {
          await push(repository, key.output, branch, token, value);
        }
      }
    }
  } catch (err) {
    logger.error(err);
  }
})();
