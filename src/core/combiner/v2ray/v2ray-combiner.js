import { isBase64, base64Decode } from '../../../utils/string.js';
import { logger } from '../../../utils/logger.js';

export default {
  combine: (contents, item) => {
    try {
      const dest = contents
        .map(content => {
          try {
            content = content.trim();
            return isBase64(content) ? base64Decode(content) : content;
          } catch (err) {
            logger.error(`Error combining ${item.id}: ${err.message}`);
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');
      return dest ? [...new Set(dest.split('\n'))].join('\n') : '';
    } catch (err) {
      logger.error(`Error combining ${item.id}: ${err.message}`);
    }
    return null;
  }
};
