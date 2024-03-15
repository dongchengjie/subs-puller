import axios from 'axios';
import { exposeContent } from '../../utils/http-proxy.js';
import logger from '../../utils/logger.js';

export default {
  convert: async (content, _source, target) => {
    let server;
    try {
      // 检查subConverter服务
      if (!(await subConverterAvaliable())) {
        throw new Error('subConverter service unavaliable');
      }
      // 启动文件代理
      server = await exposeContent(content);
      const local = `http://127.0.0.1:${server.address().port}`;
      // 构建转换地址
      const url = `http://127.0.0.1:25500/sub?target=${target}&url=${encodeURIComponent(
        local
      )}&config=https%3A%2F%2Fraw.githubusercontent.com%2FACL4SSR%2FACL4SSR%2Fmaster%2FClash%2Fconfig%2FACL4SSR_Online.ini`;
      // 订阅转换
      return await axios.get(url).then(res => res.data);
    } catch (err) {
      let message = err?.message;
      if (err?.response?.data) {
        message = err.response.data.message || err.response.data;
      }
      logger.error(`Error converting sub: ${message}`);
    } finally {
      server && server.close();
    }
    return '';
  }
};

const subConverterAvaliable = async () => {
  return axios
    .get('http://127.0.0.1:25500')
    .then(res => false)
    .catch(err => err?.response?.status == '404');
};
