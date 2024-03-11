import core from '@actions/core';

const log = (func, message) => {
  console.log(message);
  func(message);
};

export const logger = {
  debug: message => log(core.debug, message),
  error: message => log(core.error, message),
  warning: message => log(core.warning, message),
  notice: message => log(core.notice, message),
  info: message => log(core.info, message)
};
