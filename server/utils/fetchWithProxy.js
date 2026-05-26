const { ProxyAgent, fetch: undiciFetch } = require("undici");
const { getOptional } = require("../config/env");

let cachedFetch = null;

/** Node.js 的 fetch 默认不走系统代理，浏览器可以但后端会超时 */
function getFetch() {
  if (cachedFetch) return cachedFetch;

  const proxy =
    getOptional("HTTPS_PROXY") ||
    getOptional("HTTP_PROXY") ||
    getOptional("OPENAI_HTTPS_PROXY");

  if (proxy) {
    const agent = new ProxyAgent(proxy);
    cachedFetch = (url, options = {}) =>
      undiciFetch(url, { ...options, dispatcher: agent });
    return cachedFetch;
  }

  cachedFetch = fetch;
  return cachedFetch;
}

module.exports = { getFetch };
