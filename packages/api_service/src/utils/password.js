import bcrypt from 'bcrypt'
const SALT_ROUNDS=10

export async function hashPassword(plainPass){
    return bcrypt.hash(plainPass,SALT_ROUNDS)
}

export async function comparePassword(plainPassword, hashedPass){
    return bcrypt.compare(plainPassword,hashPassword)
}