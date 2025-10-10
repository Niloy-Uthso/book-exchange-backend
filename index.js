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

app.post("/users", async (req, res) => {
  const user = req.body;
  const existingUser = await users.findOne({ email: user.email });

  if (existingUser) {
    console.log("what");
    return res.send({ message: "User already exists", insertedId: null });
  }

  const result = await users.insertOne(user);
  res.send(result);
});


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

app.delete("/allbooks/:id", async(req,res)=>{

  try {
    const id = req.params.id;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ message: "User email required" });
    }

    const book = await allBooks.findOne({_id: new ObjectId(id)});
    if(!book){
      return res.status(404).json({message: "Book not found"});

      
    }
    if (book.owneremail !== userEmail) {
      return res.status(403).json({ message: "Unauthorized: Not your book" });
    }

    const result = await allBooks.deleteOne({_id: new ObjectId(id)});
     res.json({ message: "✅ Book deleted successfully", result });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: error.message });
   
  }
})

// Update a book by ID — only the owner can edit
app.patch("/allbooks-edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const requesterEmail = req.query.email; // owner email passed from frontend

    if (!requesterEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find the book
    const book = await allBooks.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Ownership check
    if (book.owneremail !== requesterEmail) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized: You can only edit your own books" });
    }

    // Perform update
    const result = await allBooks.updateOne(
      { _id: new ObjectId(id) },
      updateData // e.g. { $set: { name, writer, ... } }
    );

    res.json({
      success: true,
      message: "Book updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Express route example
 app.patch('/allbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if it's a $push operation to requestedby
    if (updateData.$push && updateData.$push.requestedby) {
      const newRequester = updateData.$push.requestedby;
      
      // Check if user already exists in requestedby array
      const book = await allBooks.findOne({ 
        _id: new ObjectId(id),
        "requestedby.email": newRequester.email 
      });
      
      if (book) {
        return res.status(400).json({ 
          error: "You have already requested this book" 
        });
      }
    }
    
    const result = await allBooks.updateOne(
      { _id: new ObjectId(id) },
      updateData
    );
    
    res.json(result);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: error.message });
  }
});

   
    app.patch("/users/:requesterEmail/add-borrowed-book", async (req, res) => {
  try {
    const requesterEmail = req.params.requesterEmail;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).send({ message: "Book ID is required" });
    }

    // 🔹 Add the borrowed book ID to the requester's borrowedbookid array (avoid duplicates)
    const result = await users.updateOne(
      { email: requesterEmail },
      { $addToSet: { borrowedbookid: bookId } } // prevents duplicate book IDs
    );

    res.send({
      success: true,
      message: "Book added to requester's borrowed list successfully.",
      result,
    });
  } catch (error) {
    console.error("Error adding borrowed book:", error);
    res.status(500).send({ message: "Server error while adding borrowed book" });
  }
});


     
 app.get("/users/:email/borrowed-books", async (req, res) => {
   
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

    console.log("Returning book - Email:", email, "Book ID:", bookId);

    if (!bookId) {
      return res.status(400).send({ message: "Book ID is required" });
    }

    // 1️⃣ Remove from user's borrowedbookid array (using string comparison)
    const userUpdate = await users.updateOne(
      { email },
      { $pull: { borrowedbookid: bookId } } // Use bookId as string, not ObjectId
    );

    console.log("User update result:", userUpdate);

    // Check if user was found and updated
    if (userUpdate.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    if (userUpdate.modifiedCount === 0) {
      console.log("Book was not found in user's borrowed array");
      // Continue anyway to update book status
    }

    // 2️⃣ Update book status to "available" & clear currenthand
    // For the book document, _id is likely still ObjectId in the database
    const bookUpdate = await allBooks.updateOne(
      { _id: new ObjectId(bookId) }, // Use ObjectId here for the book collection
      {
        $set: {
          status: "available",
          currenthand: null,
        },
      }
    );

    console.log("Book update result:", bookUpdate);

    if (bookUpdate.matchedCount === 0) {
      return res.status(404).send({ message: "Book not found" });
    }

    res.status(200).send({ 
      message: "Book returned successfully",
      userUpdate,
      bookUpdate 
    });

  } catch (error) {
    console.error("Return book error:", error);
    res.status(500).send({ 
      message: "Internal server error",
      error: error.message 
    });
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
