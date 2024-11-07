import type { ObjectId, OptionalId } from "mongodb";

export type UserModel = OptionalId<{
    name: string,
    email: string,
    age: number,
    carrito: ObjectId[]
}>

export type ItemModel = OptionalId<{
    name: string,
    price: number
}>