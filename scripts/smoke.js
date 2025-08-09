// CommonJS para evitar el warning de ESM
const http = require('http');

const checks = [
  'http://localhost:3000',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/api/occupations',
];

const get = (url) =>
  new Promise((res) => {
    const req = http.get(url, (r) => {
      res({ url, ok: r.statusCode && r.statusCode < 400, code: r.statusCode });
    });
    req.on('error', () => res({ url, ok: false, code: 0 }));
    req.end();
  });

(async () => {
  const results = await Promise.all(checks.map(get));
  console.table(results);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    console.error('Smoke tests failed.');
    process.exit(1);
  }
  console.log('Smoke tests passed.');
})();
