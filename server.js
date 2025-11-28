// server.js
const nextServer = require('./.next/standalone/server.js');

const port = process.env.PORT || 3005;
nextServer.listen(port, '0.0.0.0', () => {
});