import subConverter from '../sub-converter.js';
import { isBase64, base64Encode, base64Decode } from '../../../utils/string.js';

export default {
  convert: async (content, item) => {
    if (isBase64(content)) content = base64Decode(content);
    // 尝试拆分成多条单次转换
    const tasks = content.split('\n').map(line => {
      return new Promise(async resolve => {
        try {
          const converted = await subConverter.convert(base64Encode(line), item.source, item.target);
          resolve(converted ? line : '');
        } catch {
          resolve('');
        }
      });
    });
    content = (await Promise.all(tasks).then(res => res)).filter(Boolean).join('\n');
    content = base64Encode(content);
    return await subConverter.convert(content, item.source, item.target);
  }
};
