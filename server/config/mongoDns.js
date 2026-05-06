const dns = require('dns');

const FALLBACK_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

function isLoopback(server) {
  return server === '127.0.0.1' || server === '::1' || server.startsWith('127.');
}

function parseServers(value) {
  return value
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
}

function configureExternalDns(label = 'external services', envKey = 'EXTERNAL_DNS_SERVERS') {
  const configuredValue = process.env[envKey] || process.env.EXTERNAL_DNS_SERVERS || process.env.MONGODB_DNS_SERVERS;
  const configuredServers = configuredValue ? parseServers(configuredValue) : null;
  const currentServers = dns.getServers();
  const shouldOverride = configuredServers || currentServers.length === 0 || currentServers.every(isLoopback);

  if (!shouldOverride) return;

  const servers = configuredServers && configuredServers.length > 0
    ? configuredServers
    : FALLBACK_DNS_SERVERS;
  dns.setServers(servers);
  console.log(`Using DNS servers for ${label}: ${servers.join(', ')}`);
}

function configureMongoDns(uri) {
  if (!uri || !uri.startsWith('mongodb+srv://')) return;
  configureExternalDns('MongoDB SRV lookup', 'MONGODB_DNS_SERVERS');
}

module.exports = { configureMongoDns, configureExternalDns };
