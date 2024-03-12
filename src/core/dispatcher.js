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
  getCombiner: (source, target) => {
    switch (source) {
      case 'clash':
        return clashCombiner;
      case 'v2ray':
        return v2rayCombiner;
      default:
        return { combine: contents => (contents ? contents.join('\n') : contents) };
    }
  },
  getConverter: (source, target) => {
    // 未指定target 或 source与target相等，无需转换
    if (source === target || !target) {
      return { converter: content => content };
    }
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
        return { combine: contents => contents };
    }
  }
};
