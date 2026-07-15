import {createServer} from 'node:http'
import {Server} from 'socket.io'
import {createAdapter} from '@socket.io/redis-adapter'
import {loadConfig,createLogger,redisClient} from '@dating-app/shared'

const logger = createLogger('realtime')
const config = loadConfig('realtime')

// for socket connection we need http server connection where socket connection gets attach to http server connection
// http server connection is always required cause browser wot be able direct;y to communicate with the socket

async function main(){

    // creating a http server for socket.io connection
    // this file only maintain socket connection
    
    const server = createServer((req,res)=>{

        if(req.url  == '/health'){
            res.end(JSON.stringify({status:200, service:'Eveything good'}))
        }
        res.statusCode = 404
        res.end('not found')
    })

    // Creating socket.io server
    const io= new Server(server, {
        cors:{
            origin:"http://localhost:5173"
        }
    })


    // we use adapter for scaling
    // we use redis pub sub adapter cause this help us realtime server to communicate with each other
    // Without this, if you run 2+ realtime server instances behind a load
  // balancer, a message sent by a user connected to instance A would never
  // reach a user connected to instance B. The adapter uses Redis pub/sub
  // so every instance broadcasts through Redis, and all instances receive
  // and relay events correctly regardless of which one a user is attached to.

//   publisher is a redisclient cause u get a normal redis connection
// Redis says always to use two redis connection one is for publishing and one is for subscribing
    const pubclient = await redisClient()
    const subclient = await redisClient()

    io.adapter(createAdapter(pubclient,subclient))

    // on connection
    // when a new client enters socket is created
    io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    // Level 0 placeholder - proves the wiring works end to end.
    // Real chat-room join logic (per match_id) arrives in Level 6.
    socket.on('ping', () => {
      socket.emit('pong', { at: new Date().toISOString() });
    });

    socket.on('disconnect',(reason)=>{
        logger.info({ socketId: socket.id }, 'Client disconnected');
    })
  });

    
    

}
