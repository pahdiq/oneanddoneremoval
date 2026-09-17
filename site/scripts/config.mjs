export function validateConfig(config) {
  const origin = new URL(config.domain);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('domain must be an HTTPS origin with no path, credentials, or query.');
  config.domain = origin.origin;
  if (typeof config.indexable !== 'boolean') throw new Error('indexable must be true or false.');
  for (const key of ['googleBusinessUrl','googleReviewUrl']) {
    if (!config[key]) continue;
    const url = new URL(config[key]);
    const hosts = ['google.com','www.google.com','maps.google.com','search.google.com','g.page','maps.app.goo.gl','goo.gl','share.google'];
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password) throw new Error(`${key} must be a real HTTPS Google Business Profile or review URL.`);
  }
  if (!Array.isArray(config.confirmedServices) || config.confirmedServices.some(x=>typeof x!=='string'||!x.trim())) throw new Error('confirmedServices must contain nonempty service names.');
  if (config.indexable && !config.phone) throw new Error('Add the business phone before enabling search indexing.');
  return config;
}
