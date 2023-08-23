const fastify = require('fastify')();
const path = require('path')
fastify.register(require('@fastify/static'), { root: path.join(__dirname, 'uploads'), prefix: '/', });

fastify.register(require('./app'));

fastify.listen({ port: 3031 }, (err) => {
    console.log(`server listening on ${fastify.server.address().port}`);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})