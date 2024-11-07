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

export type Item = {
    id: string,
    name: string,
    price: number
}

export type User = {
    id: string,
    name: string,
    email: string,
    age: number,
    carrito: Item[]
}