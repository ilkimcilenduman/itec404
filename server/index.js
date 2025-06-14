require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const db = require('./config/database');

app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.send('Digital Club Management API is running');
});

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const electionRoutes = require('./routes/elections');
const clubRequestRoutes = require('./routes/club-requests');
const forumRoutes = require('./routes/forum');


app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/club-requests', clubRequestRoutes);
app.use('/api/forum', forumRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  await db.setupDatabase();
});
