import { fetchContents } from "../../utils/fetcher.js";
import logger from "../../utils/logger.js";

export default {
  acquire: async (item) => {
    try {
      const timeout = item.timeout ?? 10000;
      const headers = item.headers;
      const contents = await fetchContents(item.urls, timeout, headers, (successes, failures) =>
        logger.info(`${item.id} pre-fetch completed, ${successes} successes and ${failures} failures`)
      );
      // 生成处理函数
      const func = (() => {
        try {
          return eval(item?.options?.func);
        } catch {
          return (str) => "";
        }
      })();
      // 预处理得到urls
      const urls = contents
        .map((content) => func(content).trim())
        .filter(Boolean);
      const result = await fetchContents(urls, timeout, headers, (successes, failures) =>
        logger.info(`${item.id} post-fetch completed, ${successes} successes and ${failures} failures`)
      );
      return [item, result];
    } catch (err) {
      logger.error(`Error acquiring ${item.id}: ${err.message}`);
      return [item, []];
    }
  },
};
