const config = require('./config/config');
const fs = require('fs');
const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);
const sharp = require('sharp');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const dirList = [
  { type: 6, dir: "./uploads/review" },
  { type: 2, dir: "./uploads/offers" },
  { type: 3, dir: "./uploads/place" },
  { type: 8, dir: "./uploads/member" },
  { type: 5, dir: "./uploads/article" },
  { type: 1, dir: "./uploads/publish" },
  { type: 4, dir: "./uploads/category" },
  { type: 7, dir: "./uploads/comment" },
  { type: 9, dir: "./uploads/reply" },
  { type: 11, dir: "./uploads/publisher" },
  { type: 13, dir: "./uploads/announcement" }
]

for (let dir of dirList) {
  if (!fs.existsSync(dir.dir)) {
    fs.mkdirSync(dir.dir);
  }
}

function routes(fastify, options, done) {
  fastify.register(require('@fastify/formbody'));
  fastify.register(require('@fastify/jwt'), { secret: config.app.hashSecret, decode: { complete: true } });
  fastify.register(require('@fastify/multipart'),  { limits: { fileSize: 15 * 1024 * 1024 } });

  fastify.register(require('@fastify/cors'), {
    origin: '*',
    allowedHeaders: ['*'],
    exposedHeaders: ['Content-Type', 'Authorization', 'Accept',],
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      const globalOptions = fastify.jwt.options
      await request.jwtVerify();
      const token = request.headers.authorization.replace('Bearer ', '');
      const decoded = await fastify.jwt.decode(token)
      globalOptions.decode = decoded;
      global.authentication = decoded.payload;
    } catch (err) {
      reply.status(401).send({ code: 401, status: 'Error', messages: 'Unauthorized' });
    }
  })

  const generateNewFilename = async (filename) => {
    return `${Date.now()}.${filename.split('.').pop()}`;
  }

  fastify.get('/', async (request, reply) => {
    reply.send({ messages: 'media uploads api for me-messages' });
  });

  fastify.post('/uploadFile/:type_id', { onRequest: [fastify.authenticate] }, async function (req, reply) {
    try {
      const fileList = [];
      const mockDir = dirList;
      const type_id = req.params.type_id;
      const dir = mockDir.filter((x) => +x.type === +type_id).map(({ type, dir }) => dir).toString();
      const dirName = dir.replace('./uploads/', '');
      const accept = ['jpg', 'jepg', 'png', 'webp',];
      const videoExtensions = ['mp4'];
      const parts = req.files();
      for await (const part of parts) {
        const typeFile = part.filename.split(".")[1];
        const filename = await generateNewFilename(part.filename);
        if (accept.includes(typeFile)) {
          await pump(part.file, fs.createWriteStream(`${dir}/${filename}`));
          await sharp(fs.readFileSync(`${dir}/${filename}`)).jpeg({ quality: 30 }).toFile(`${dir}/${filename}`);
        }else if(videoExtensions.includes(typeFile)){
          await new Promise((resolve, reject) => {
            ffmpeg()
              .input(part.file)
              .outputOptions([
                '-crf 31',
                '-c:v libx264', // ใช้การบีบอัด H.264
                '-b:v 100K',   // อัตราบิตสูงสุด
                '-b:a', '100k',
                '-c:a', 'mp3',
                '-maxrate 100K', // อัตราบิตสูงสุด
                '-bufsize 30K', // ขนาดแคชสำหรับบิตเรตสูงสุด
                '-vf scale=256:144',
              ])
              .on('end', () => resolve())
              .on('error', error => reject(error))
              .save(`${dir}/${filename}`);
          });
        }else{
          reply.status(500).send({ code: 500, status: 'Error' });
        }
        const setData = {
          updateItem: 0,
          type_id: type_id,
          path: `${dirName}/${filename}`,
          media_type: (accept.includes(typeFile) ? 1 : (typeFile === 'pdf') ? 2 : (typeFile === 'mp4') ? 3 : 4),
        }
        if (part.fieldname === 'coverMember' && +type_id === 8) {
          setData.updateItem = 8
        }
        if (part.fieldname === 'coverPlace' && +type_id === 3) {
          setData.updateItem = 3
        }

        fileList.push(setData)
      }
      reply.status(200).send({ code: 200, status: 'Success', value: fileList });

    } catch (error) {
      console.error(error);
      reply.status(500).send({ code: 500, status: 'Error' });
    }
  });

  fastify.post('/uploadDocumentPublisher', { onRequest: [fastify.authenticate] }, async function (req, reply) {
    try {
      const fileList = [];
      const mockDir = dirList;
      const type_id = 11
      const dir = mockDir.filter((x) => +x.type === +type_id).map(({ type, dir }) => dir).toString();
      const dirName = dir.replace('./uploads/', '');
      const accept = ['jpg', 'jepg', 'png', 'webp'];
      const videoExtensions = ['mp4'];
      const parts = req.files();
      for await (const part of parts) {
        const typeFile = part.filename.split(".")[1];
        const filename = await generateNewFilename(part.filename);
        if (accept.includes(typeFile)) {
          await pump(part.file, fs.createWriteStream(`${dir}/${filename}`));
          await sharp(fs.readFileSync(`${dir}/${filename}`)).jpeg({ quality: 70 }).toFile(`${dir}/${filename}`);
        }else if(videoExtensions.includes(typeFile)){
          await new Promise((resolve, reject) => {
            ffmpeg()
              .input(part.file)
              .outputOptions([
                '-crf 31',
                '-c:v libx264', // ใช้การบีบอัด H.264
                '-b:v 144K',   // อัตราบิตสูงสุด
                '-b:a', '100k',
                '-c:a', 'mp3',
                '-maxrate 100K', // อัตราบิตสูงสุด
                '-bufsize 30K', // ขนาดแคชสำหรับบิตเรตสูงสุด
                '-vf scale=256:144',
              ])
              .on('end', () => resolve())
              .on('error', error => reject(error))
              .save(`${dir}/${filename}`);
          });
        }else{
          reply.status(500).send({ code: 500, status: 'Error' });
        }
        const setData = {
          type_id: type_id,
          path: `${dirName}/${filename}`,
          document_type: (part.fieldname === 'idCard') ? 1 : (part.fieldname === 'selfieIdcard') ? 2 : (part.fieldname === 'nonThaiCard') ? 3 : (part.fieldname === 'passport') ? 4 : 0,
          media_type: (accept.includes(typeFile) ? 1 : (typeFile === 'pdf') ? 2 : (typeFile === 'mp4') ? 3 : 4),
        }
        fileList.push(setData)
      }
      reply.status(200).send({ code: 200, status: 'Success', value: fileList });

    } catch (error) {
      console.error(error);
      reply.status(500).send({ code: 500, status: 'Error' });
    }
  });

  done();
}

module.exports = routes;