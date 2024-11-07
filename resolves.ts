import type { Collection } from "mongodb";
import type { Item, ItemModel, User, UserModel } from "./types.ts";

export const getCarrito = async(
    user: UserModel,
    itemCollection: Collection<ItemModel>
):Promise<User> => {
    const aux = await itemCollection.find({_id:{$in:user.carrito}}).toArray()
    return ({
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        carrito: aux.map(e => change(e)) 
    })
}

export const change = (
    item: ItemModel
):Item => {
    return ({
        id: item._id,
        name: item.name,
        price: item.price
    })
}