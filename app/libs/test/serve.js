const server = require('fastify')({ logger: false })
const path = require('path')

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log('server.register', server.register);

server.register(require('fastify-static'), {
    root: path.join(__dirname, 'page'),
    prefix: '/',
})

console.log('port', port);
server.listen(port, (err, address) => {
    server.log.info(`🚀 🍀😎 serving ./test/page @ http://${address}:${port}`);
});
