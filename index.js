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

app.post("/conversations", async (req, res) => {
  try {
    const { senderEmail, receiverEmail } = req.body;

    // Check if conversation already exists
    const existing = await conversations.findOne({
      members: { $all: [senderEmail, receiverEmail] },
    });

    if (existing) {
      return res.status(200).send(existing);
    }

    // Create new conversation
    const newConv = {
      members: [senderEmail, receiverEmail],
      createdAt: new Date(),
    };

    const result = await conversations.insertOne(newConv);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).send({ message: "Failed to create conversation" });
  }
});


// Get all conversations for a user
app.get("/conversations/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    const userConvs = await conversations
      .find({ members: userEmail })
      .toArray();
    res.status(200).send(userConvs);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).send({ message: "Failed to fetch conversations" });
  }
});

// Send a message
app.post("/messages", async (req, res) => {
  try {
    const { conversationId, sender, text } = req.body;

    const newMsg = {
      conversationId,
      sender,
      text,
      createdAt: new Date(),
    };

    const result = await messages.insertOne(newMsg);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({ message: "Failed to send message" });
  }
});

// Get all messages of a conversation
app.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const msgs = await messages
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray();
    res.status(200).send(msgs);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send({ message: "Failed to fetch messages" });
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
