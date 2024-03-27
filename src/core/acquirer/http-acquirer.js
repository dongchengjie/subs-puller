import { fetchContents } from '../../utils/fetcher.js';
import logger from '../../utils/logger.js';

export default {
  acquire: async item => {
    try {
      const timeout = item.timeout ?? 10000;
      const headers = item.headers;
      const result = await fetchContents(item.urls, timeout, headers, (successes, failures) =>
        logger.info(`${item.id} fetch completed, ${successes} successes and ${failures} failures`)
      );
      return [item, result];
    } catch (err) {
      logger.error(`Error acquiring ${item.id}: ${err.message}`);
      return [item, []];
    }
  }
};
