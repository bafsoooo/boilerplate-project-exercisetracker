const express = require('express')
const app = express()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')
const User = require('./models/user')
const Exercise = require('./models/exercise')
require('dotenv').config()

app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Optional: Adjust the timeout as needed
  }).then(() => {
  console.log('Connected to MongoDB');
  }).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

app.post('/api/users',async (req,res)=>{
  const username = req.body.username;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = new User({ username });

  try {
    const data = await user.save();
    res.json({ username: data.username, _id: data._id });
  } catch (err) {
    res.json({ error: err.message });
  }

});

app.get('/api/users',async (req,res)=>{
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.json({ error: err.message });
  }
})

app.post('/api/users/:_id/exercises', async (req,res)=>{
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  try {
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const exercise = new Exercise({
        userId,
        description,
        duration,
        date: date ? new Date(date) : new Date() // Use provided date or default to current date
    });

    await exercise.save();

    res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString() // Format date as a string
    });
  }catch (err) {
    res.json({ error: err.message });
  }
})

app.get('/api/users/:_id/logs', async (req,res)=>{
  const userId = req.params._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json({ error: 'Invalid user ID' });
  }

  const from = req.query.from ? new Date(req.query.from) : undefined;
  const to = req.query.to ? new Date(req.query.to) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

  try {
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: user._id };
    if (from) query.date = { ...query.date, $gte: from };
    if (to) query.date = { ...query.date, $lte: to };

    let log = await Exercise.find(query).limit(limit || 0).exec();

    log = log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date ? exercise.date.toDateString() : 'No date provided' // Handle null dates
    }));

    if (from) {
        const fromDate = new Date(from);
        log = log.filter(exercise => exercise.date >= fromDate);
    }

    if (to) {
        const toDate = new Date(to);
        log = log.filter(exercise => exercise.date <= toDate);
    }

    if (limit) {
        log = log.slice(0, limit);
    }

    res.json({
        _id: user._id,
        username: user.username,
        count: log.length,
        log: log
    });
  }catch (err) {
      res.json({ error: err.message });
    }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
