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
const conversations = database.collection("conversations");
const messages = database.collection("messages");
const users =database.collection("users")

app.post("/users", async (req, res)=>{
  const user = req.body;
  const result = await users.insertOne(user)
  res.send(result);
})

// GET /users/search?email=query
app.get("/users/search", async (req, res) => {
  const emailQuery = req.query.email;
  if (!emailQuery) return res.json([]);

  const user = await  users
    .find({ email: { $regex: emailQuery, $options: "i" } })
    .limit(10)
    .toArray();

  res.json(user);
});

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

// Express route example
 app.patch('/allbooks/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Use the allBooks collection that you defined
        const result = await allBooks.updateOne(
          { _id: new ObjectId(id) },
          updateData // This should handle $push operator
        );
        
        res.json(result);
      } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: error.message });
      }
    });

     
 app.get("/users/:email/borrowed-books", async (req, res) => {
  console.log("jfidhfgihgshjdhfhdfghdifhgidhgfihdgfh")
  try {
    const email = req.params.email;
    
    const userDoc = await users.findOne({ email });

    if (!userDoc || !userDoc.borrowedbookid || userDoc.borrowedbookid.length === 0) {
      return res.send([]);
    }

    const ids = userDoc.borrowedbookid.map((id) => {
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });

    const borrowedBooks = await allBooks
      .find({ _id: { $in: ids } })
      .toArray();

    res.send(borrowedBooks);
  } catch (err) {
    console.error("Error fetching borrowed books:", err);
    res.status(500).send({ message: "Server error" });
  }
});
app.patch("/users/:email/return-book", async (req, res) => {
  try {
    const email = req.params.email;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).send({ message: "Book ID is required" });
    }

    // 1️⃣ Remove from user's borrowedbookid array
    await users.updateOne(
      { email },
      { $pull: { borrowedbookid: bookId } }
    );

    // 2️⃣ Update book status to "available" & clear currenthand
    await allBooks.updateOne(
      { _id: new ObjectId(bookId) },
      {
        $set: {
          status: "available",
          currenthand: null,
        },
      }
    );

    res.send({ success: true, message: "Book returned successfully" });
  } catch (err) {
    console.error("Error returning book:", err);
    res.status(500).send({ message: "Server error" });
  }
});

    

    


 



 

// ✅ Create new conversation (if not already exists)
 
  


// Send a message
 



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
