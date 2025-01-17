import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(bodyParser.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello happy thoughts");
});

// 1
// This endpoint should return a maximum of 20 thoughts, sorted by createdAt to show the most recent thoughts first.
// GET request
app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find()
    .sort({ createdAt: "desc" })
    .limit(20)
    .exec();
  res.json(thoughts);
});

// 2
// This endpoint expects a JSON body with the thought `message`, like this: `{ "message": "Express is great!" }`. If the input is valid (more on that below), the thought should be saved, and the response should include the saved thought object, including its `_id`.
// POST request
app.post("/thoughts", async (req, res) => {
  // Retrieve the information sent by the client to our API endpoint
  const { message } = req.body;

  //Use our mongoose model to creare the database entry
  const thought = new Thought({ message });

  try {
    //Success
    const savedThought = await thought.save();
    res.status(201).json(savedThought);
  } catch (err) {
    console.log(err)
    res
      .status(400)
      .json({
        message: "Could not save the thought to the database",
        error: err.errors,
      });
  }
});

// This endpoint doesn't require a JSON body. Given a valid thought id in the URL, the API should find that thought, and update its `hearts` property to add one heart.
// POST request
app.post("/thoughts/:thoughtId/like", async (req, res) => {
  const thoughtId = req.params.thoughtId;
  try {
    const thoughtLiked = await Thought.updateOne(
      { _id: thoughtId },
      { $inc: { hearts: 1 } }
    );
    res.json(thoughtLiked);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Thought was not found", error: err.errors });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
