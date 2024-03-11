export default {
  combine: contents => {
    const dest = contents
      .map(content => {
        try {
          return isBase64(content) ? base64Decode(content) : content;
        } catch (err) {
          logger.error(`Error parsing clash config: ${err.message}`);
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');
    return dest ? [...new Set(dest.split('\n'))].join('\n') : '';
  }
};
