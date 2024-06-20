const express = require('express');
const { Pool } = require('pg');

// Initialize Express
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Only for development, remove in production
  },
});

// Handle form submission
app.post('/submit', (req, res) => {
  const data = req.body;
  const subjects = Array.isArray(data.subjects) ? data.subjects : [data.subjects];

  // Example query to insert data into PostgreSQL
  const query = {
    text: 'INSERT INTO students (name, student_id, email, branch, subjects) VALUES ($1, $2, $3, $4, $5)',
    values: [data.name, data['student-id'], data.email, data.branch, subjects.join(',')],
  };

  // Execute query
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error executing query', err);
      res.status(500).send('Error submitting form');
    } else {
      console.log('Form submitted successfully');
      res.send('Form submitted successfully');
    }
  });
});

// Example route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
