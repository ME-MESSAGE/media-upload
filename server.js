const fastify = require('fastify')();
const path = require('path')
fastify.register(require('@fastify/static'), { root: path.join(__dirname, 'uploads'), prefix: '/', });
fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/multipart'), { limits: { fileSize: 50 * 1024 * 1024 } });
fastify.register(require('@fastify/cors'), {
  origin: '*',
  allowedHeaders: ['*'],
  exposedHeaders: ['Content-Type', 'Authorization', 'Accept',],
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false
});

fastify.register(require('./app'));

fastify.listen({ port: 3031 }, (err) => {
  console.log(`server listening on ${fastify.server.address().port}`);
  fastify.log.info(`server listening on ${fastify.server.address().port}`);
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})