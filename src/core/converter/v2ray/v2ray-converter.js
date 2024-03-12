import subConverter from '../sub-converter.js';
import { isBase64, base64Encode } from '../../../utils/string.js';

export default {
  convert: async (content, source, target) => {
    if (!isBase64(content)) {
      content = base64Encode(content);
    }
    return await subConverter.convert(content, source, target);
  }
};
