import http from 'http';
/**
 * 暴露文本内容
 * @param {string} content 文本内容
 * @param {Function} onStarted 服务器启动后回调
 * @returns 服务器对象
 */
export const exposeContent = content => {
  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
      res.end(content);
    });
    server.listen(0, () => resolve(server));
    server.on('error', err => reject(err));
  });
};
