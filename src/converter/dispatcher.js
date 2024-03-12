import axios from 'axios';
import { exposeContent } from '../utils/http-proxy.js';
import { logger } from '../utils/logger.js';

// 订阅合并器
import clash_combine from './clash/clash-combine.js';
import v2ray_combine from './v2ray/v2ray-combine.js';

export const getCombiner = source => {
  switch (source) {
    case 'clash':
      return clash_combine.combine;
    case 'v2ray':
      return v2ray_combine.combine;
    default:
      return contents => (contents ? contents.join('\n') : contents);
  }
};

export const getConverter = (source, target) => {
  return !target || source === target ? content => content : subConverter;
};

// 订阅转换器
const subConverter = async (content, _source, target) => {
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
};

const subConverterAvaliable = async () => {
  return axios
    .get('http://127.0.0.1:25500')
    .then(res => {
      return false;
    })
    .catch(err => {
      return err?.response?.status === '404' && err?.response?.data === 'File not found.';
    });
};
