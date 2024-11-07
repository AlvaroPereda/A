import { MongoClient, ObjectId } from "mongodb"
import type { ItemModel, UserModel } from "./types.ts";
import { getCarrito } from "./resolves.ts";

const url = Deno.env.get("MONGO_URL")

if(!url) {
  console.log("Url no encontrada")
  Deno.exit(1)
}

const client = new MongoClient(url)

await client.connect()
console.log("Conectado correctamente a la base de datos")

const db = client.db("A")

const userCollection = db.collection<UserModel>("users")
const itemCollection = db.collection<ItemModel>("items")

const handler = async(req : Request): Promise<Response> => {
  const url = new URL(req.url)
  const method = req.method
  const path = url.pathname
  const searchParams = url.searchParams

  if(method === "GET") {
    if(path === "/users") {
      const result = await userCollection.find().toArray()
      const resultFinal = await Promise.all(result.map(e => getCarrito(e,itemCollection)))
      return new Response(JSON.stringify(resultFinal))
    } else if(path === "/user") {
      const id = searchParams.get("id")
      if(!id) return new Response("Bad request", {status:400})
      const result = await userCollection.findOne({_id: new ObjectId(id)})
      if(!result) return new Response("User not found", {status:404})
      const resultFinal = await getCarrito(result,itemCollection)
      return new Response(JSON.stringify(resultFinal))
    } else if(path === "/items") {
      const result = await itemCollection.find().toArray()
      return new Response(JSON.stringify(result))
    } else if(path === "/item") {
      const id = searchParams.get("id")
      if(!id) return new Response("Bad request", {status:400})
      const result = await itemCollection.findOne({_id: new ObjectId(id)})
      if(!result) return new Response("Item not found", {status:404})
      return new Response(JSON.stringify(result))
    }
  } else if(method === "POST") {
    if(path === "/user") {
      const body = await req.json()
      if(body.id_user || body.id_item) {
        const { modifiedCount } = await userCollection.updateOne(
          {_id:new ObjectId(body.id_user)},
          {$push:{carrito:new ObjectId(body.id_item)}}
        )
        if(modifiedCount === 0) return new Response("User not found", {status:404})
        return new Response("Se ha añadido un item al usuario")
      } else if(body.name || body.email || body.age) {
        const { insertedId } = await userCollection.insertOne({
          name: body.name,
          email: body.email,
          age: body.age,
          carrito: []
        })
        return new Response("Usuario insertado correctamente con ID: " + insertedId)
      } return new Response("Bad request", {status:400})
    } else if(path === "/item") {
      const body = await req.json()
      if(!body.name || !body.price) return new Response("Bad request", {status:400})
      const comprobar = await itemCollection.find({name:body.name}).toArray()
      if(comprobar.length > 0) return new Response("Item already introduced", {status:404})
      const { insertedId } = await itemCollection.insertOne({
        name: body.name,
        price: body.price
      }) 
      return new Response(JSON.stringify({
        id: insertedId,
        name: body.name,
        price: body.price
      }))
    }
  } else if(method === "PUT") {
    if(path === "/user") {
      const body = await req.json()
      if(!body.id || !body.name || !body.email || !body.age || !body.carrito) return new Response("Bad request", {status:400})
      const comprobarItems = await itemCollection.find({_id:{$in:body.carrito.map((e:string) => new ObjectId(e))}}).toArray()
      if(comprobarItems.length !== body.carrito.length) return new Response("Item not found", {status:404})
      const { modifiedCount } = await userCollection.updateOne(
        {_id:new ObjectId(body.id)},
        {$set: {
          name: body.name,
          email: body.email,
          age: body.age,
          carrito: body.carrito.map((e:string) => new ObjectId(e))
        }}
      )
      if(modifiedCount === 0) return new Response("User not found", {status:404})
      return new Response("Usuario actualizado correctamente")
    } else if(path === "/item") {
      const body = await req.json()
      if(!body.id || !body.name || !body.price) return new Response("Bad request", {status:400})
      const { modifiedCount } = await itemCollection.updateOne(
        {_id: new ObjectId(body.id)},
        {$set: {name:body.name,price:body.price}}
      )
      if(modifiedCount === 0) return new Response("Item not found", {status:404})
      return new Response("Item actualizado correctamente")
    } 
  } else if(method === "DELETE") {
    if(path === "/user") {
      const body = await req.json()
      if(!body.id) return new Response("Bad request", {status:400})
      const { deletedCount } = await userCollection.deleteOne({_id:new ObjectId(body.id)})
      if(deletedCount === 0) return new Response("User not found", {status:404})
      return new Response("Usuario borrado correctamente")
    } else if(path === "/item") {
        const body = await req.json()
        if(!body.id) return new Response("Bad request", {status:400})
        const { deletedCount } = await itemCollection.deleteOne({_id:new ObjectId(body.id)})
        if(deletedCount === 0) return new Response("Item not found", {status:404})
        
        await userCollection.updateMany(
          {carrito: new ObjectId(body.id)},
          {$pull:{carrito:new ObjectId(body.id)}}
        ) 
        return new Response("Item borrado correctamente")
    }
  }

  return new Response("Endpoint not found", {status:404})
}

Deno.serve({port:3000}, handler)