const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");

// const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t3hmlwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("bookExchange");  
   const  allBooks = database.collection("allbooks")

   app.post("/allbooks", async (req, res) => {
  const book = req.body;
  const result = await  allBooks.insertOne(book);
  res.send(result);
});

app.get("/allbooks", async (req,res)=>{
try{
  const email = req.query.email;
   const query = email ? { owneremail: email } : {}; // filter if email provided
    const books = await allBooks.find(query).toArray();

    res.status(200).send(books);
}
catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send({ message: "Failed to fetch books" });
  }

})

const { ObjectId } = require("mongodb");

app.get("/allbooks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const book = await allBooks.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).send({ message: "Book not found" });
    }

    res.status(200).send(book);
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    res.status(500).send({ message: "Failed to fetch book details" });
  }
});



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('book exchange server is running')
})

app.listen(port, () => {
  console.log(`Book exchange server app listening on port ${port}`)
})
