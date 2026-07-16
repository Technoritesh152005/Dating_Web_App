
import {verifyAccessToken} from '../utils/token.js'
export function registerAuthDecorator(app,config){

    app.decorator('authenticate', async(request,reply)=>{
        const token = request.cookies?.accessToken

        if(!token){
            return reply.code(401).send({error:'Access Token Not Found/ Not Authenticated'})
        }


        try{

            const payload = verifyAccessToken(token , config.jwtSecret)
            request.userId = payload.sub
        }catch(error){
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }
    })
}