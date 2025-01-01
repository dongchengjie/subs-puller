// 订阅拉取器
import httpAcquirer from './acquirer/http-acquirer.js';
import postHttpAcquirer from './acquirer/post-http-acquirer.js';
import githubAcquirer from './acquirer/github-acquirer.js';

// 订阅合并器
import clashCombiner from './combiner/clash/clash-combiner.js';
import v2rayCombiner from './combiner/v2ray/v2ray-combiner.js';

// 订阅转换器
import clashConverter from './converter/clash/clash-converter.js';
import v2rayConverter from './converter/v2ray/v2ray-converter.js';
import subConverter from './converter/sub-converter.js';

// 订阅后置处理器
import clashPostProcessor from './post-processor/clash/clash-result-processor.js';
import v2rayPostProcessor from './post-processor/v2ray/v2ray-result-processor.js';

export default {
  getAcquirer: type => {
    switch (type) {
      case 'http':
        return httpAcquirer;
      case 'post-http':
        return postHttpAcquirer;
      case 'github':
        return githubAcquirer;
      default:
        return { acquire: item => [item, []] };
    }
  },
  getCombiner: (source, target) => {
    switch (source) {
      case 'clash':
        return clashCombiner;
      case 'v2ray':
        return v2rayCombiner;
      default:
        return { combine: content => (content ? content.join('\n') : content) };
    }
  },
  getConverter: (source, target) => {
    if (!target || source === target) return { convert: content => content };
    switch (source) {
      case 'clash':
        return clashConverter;
      case 'v2ray':
        return v2rayConverter;
      default:
        return { convert: subConverter.convert };
    }
  },
  getResultProcessor: (source, target) => {
    switch (target) {
      case 'clash':
        return clashPostProcessor;
      case 'v2ray':
        return v2rayPostProcessor;
      default:
        return { combine: content => content };
    }
  }
};
