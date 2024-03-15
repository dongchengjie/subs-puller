import { isBase64, base64Encode, base64Decode, substringBeforeLast } from '../../../utils/string.js';
import logger from '../../../utils/logger.js';

export default {
  process: async (content, item) => {
    try {
      content = isBase64(content) ? base64Decode(content) : content;
      content
        .split('\n')
        .filter(Boolean)
        .map(parse)
        .filter(params => !params.fp || isValidFingerprint(params.fp))
        .map(params => params.__raw)
        .filter(Boolean)
        .join('\n');
      return base64Encode(content);
    } catch (err) {
      logger.error(`Error processing ${item.id}: ${err.message}`);
    }
    return null;
  }
};

const parse = config => {
  let result = { __raw: config };
  try {
    const match = config.match(/^(.*?):\/\/(.*)$/);
    const protocal = match[1].toLocaleLowerCase();
    const uri = match[2];
    switch (protocal) {
      case 'vmess':
        if (isBase64(uri)) {
          const jsonStr = base64Decode(uri);
          try {
            result = { ...result, ...JSON.parse(jsonStr) };
          } catch {}
        }
        break;
      case 'ss':
        break;
      case 'vless':
      case 'socks':
      case 'trojan':
      case 'hysteria2':
      case 'tuic':
      case 'wireguard':
        const noName = substringBeforeLast(uri, '#');
        if (noName?.length > 2 && noName.includes('?')) {
          const args = noName.substring(noName.indexOf('?') + 1).split('&');
          for (let arg of args) {
            if (/^(.*?)=(.*)$/.test(arg)) {
              const pair = arg.split('=');
              result[pair[0]] = pair[1];
            }
          }
        }
        break;
    }
  } catch (err) {
    logger.error(`Error parsing v2ray args: ${err.message}`);
  }
  return result;
};

const isValidFingerprint = fingerprint => {
  return (
    !fingerprint ||
    ['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', '360', 'qq', 'random', 'randomized'].includes(fingerprint)
  );
};
