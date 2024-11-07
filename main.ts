import { MongoClient } from "mongodb"
import type { ItemModel, UserModel } from "./types.ts";

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
  return new Response("Buenas")
}

Deno.serve({port:3000}, handler)