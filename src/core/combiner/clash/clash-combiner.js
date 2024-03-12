import { currentDir } from '../../../utils/path.js';
import { isBase64, base64Decode, idSuffixNames } from '../../../utils/string.js';
import { load, dump } from 'js-yaml';
import { logger } from '../../../utils/logger.js';
import { readFileSync } from 'fs';

export default {
  combine: (contents, item) => {
    try {
      let proxies = contents
        .map(content => {
          try {
            content = isBase64(content) ? base64Decode(content) : content;
            return load(content)?.['proxies'];
          } catch (err) {
            logger.error(`Error combining ${item.id}: ${err.message}`);
          }
          return null;
        })
        .filter(Boolean);
      // 去重
      proxies = proxies.reduce((acc, curr) => {
        if (!acc.some(obj => obj.type === curr.type && obj.server === curr.server && obj.port === curr.port)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      // 解决代理名称冲突
      idSuffixNames(
        proxies,
        proxy => proxy.name,
        (proxy, _name) => (proxy.name = _name)
      );
      // 根据模板生成配置
      if (proxies.length === 0) return null;
      return generateConfig(proxies);
    } catch (err) {
      logger.error(`Error combining ${item.id}: ${err.message}`);
    }
    return null;
  }
};

const generateConfig = proxies => {
  const template = readFileSync(currentDir() + '/tempalte.yaml', 'utf8');
  return template.replace(
    'proxies: []',
    'proxies: \n' +
      dump(proxies, {
        skipInvalid: true,
        flowLevel: 1,
        sortKeys: false,
        forceQuotes: true,
        styles: {
          '!!null': 'empty',
          '!!bool': 'lowercase'
        }
      })
  );
};
