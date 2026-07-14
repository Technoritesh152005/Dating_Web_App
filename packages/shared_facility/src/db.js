import { PrismaClient} from "@prisma/client"

// we use singleton pattern cause after hot reload every prisma client connection is created/ so we make a common instance on globalthis

const globalForPrisma = globalThis;

// prisma is ur obj which helps to connect with db
export const prisma = globalForPrisma.__prisma ?? 
// prismaclient is a class for a schema. ur creating a object of it
                      new PrismaClient({
                        log:process.env.NODE_ENV === 'development' ? ['warn','error'] : ['error']
                      })

                    //   u dont create multiple prisma cause multiple prisma makes connection pools with multiple connection request

                    if (process.env.NODE_ENV !== 'production') {
                        globalForPrisma.__prisma = prisma;
                      }        

                      
export const connectDb(logger){
    await prisma.$connect();
    logger.info('Postgres Connected')
    return prisma
}

export async disconnectDb(){
    await prisma.$disconnect
}