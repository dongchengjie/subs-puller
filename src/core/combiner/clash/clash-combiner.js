import { currentDir } from '../../../utils/path.js';
import { isBase64, base64Decode, idSuffixNames } from '../../../utils/string.js';
import { load, dump } from 'js-yaml';
import logger from '../../../utils/logger.js';
import { readFileSync } from 'fs';

export default {
  combine: contents => {
    const proxies = contents
      .map(content => {
        try {
          content = isBase64(content) ? base64Decode(content) : content;
          return load(content)?.['proxies'];
        } catch (err) {
          logger.error(`Error parsing clash config: ${err.message}`);
        }
        return null;
      })
      .filter(Boolean)
      .reduce((acc, curr) => acc.concat(curr), [])
      .filter(Boolean)
      .filter(proxy => proxy['name'] && proxy['type'] && proxy['server'] && proxy['port']);
    return generateConfig(proxies);
  }
};

export const generateConfig = proxies => {
  // 代理去重
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
  if (proxies.length === 0) return null;

  // 根据模板生成配置
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
