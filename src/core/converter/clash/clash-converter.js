import subConverter from '../sub-converter.js';

export default {
  convert: async (content, item) => {
    return await subConverter.convert(content, item.source, item.target);
  }
};
