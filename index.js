const express = require('express')
const app = express()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')
const User = require('./models/user')
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



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
