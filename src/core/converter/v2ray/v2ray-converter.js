import subConverter from '../sub-converter.js';
import { isBase64, base64Encode } from '../../../utils/string.js';

export default {
  convert: async (content, item) => {
    // subConverter不识别非Base64编码的v2ray配置
    if (!isBase64(content)) content = base64Encode(content);
    return await subConverter.convert(content, item.source, item.target);
  }
};
