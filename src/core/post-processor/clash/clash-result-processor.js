import { load, dump } from 'js-yaml';
import { logger } from '../../../utils/logger.js';
import subConverter from '../../converter/sub-converter.js';

export default {
  process: async (content, item) => {
    try {
      // 转成json对象
      const json = load(content);
      json['proxies'] = json['proxies']
        .map(proxy => {
          if (proxy?.type === 'ss') {
            const cipherOK = isValidShadowsocksCipher(proxy?.cipher);
            const pluginOK = isValidShadowsocksPlugin(proxy?.plugin);
            const pluginOptionsOK = proxy?.['plugin-opts']?.mode || !['obfs', 'v2ray-plugin'].includes(proxy?.plugin);
            const fingerprintOK =
              isValidFingerprint(proxy?.['fingerprint']) && isValidFingerprint(proxy?.['client-fingerprint']);
            return cipherOK && pluginOK && pluginOptionsOK && fingerprintOK ? proxy : null;
          } else {
            return proxy;
          }
        })
        .filter(Boolean);
      // 转回yaml
      return await subConverter.convert(dump(json), 'clash', 'clash');
    } catch (err) {
      logger.error(`Error processing ${item.id}: ${err.message}`);
    }
    return null;
  }
};

const isValidShadowsocksCipher = cipher => {
  return (
    !cipher ||
    [
      'aes-128-gcm',
      'aes-192-gcm',
      'aes-256-gcm',
      'aes-128-cfb',
      'aes-192-cfb',
      'aes-256-cfb',
      'aes-128-ctr',
      'aes-192-ctr',
      'aes-256-ctr',
      'rc4-md5',
      'chacha20-ietf',
      'xchacha20',
      'chacha20-ietf-poly1305',
      'xchacha20-ietf-poly1305',
      '2022-blake3-aes-128-gcm',
      '2022-blake3-aes-256-gcm',
      '2022-blake3-chacha20-poly1305'
    ].includes(cipher)
  );
};

const isValidShadowsocksPlugin = plugin => {
  return !plugin || ['obfs', 'v2ray-plugin', 'shadow-tls', 'restls'].includes(plugin);
};

const isValidFingerprint = fingerprint => {
  return (
    !fingerprint ||
    ['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', '360', 'qq', 'random'].includes(fingerprint)
  );
};
