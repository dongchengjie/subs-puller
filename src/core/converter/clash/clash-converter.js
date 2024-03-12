import subConverter from '../sub-converter.js';

export default {
  convert: async (content, source, target) => {
    return await subConverter.convert(content, source, target);
  }
};
