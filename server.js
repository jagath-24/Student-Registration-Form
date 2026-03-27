const express = require('express');
const path = require('path');
const { getDb, persist } = require('./database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// INSERT — register a student
app.post('/api/students', async (req, res) => {
  const { name, email, dob, department, phone } = req.body;

  if (!name || !email || !dob || !department || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const db = await getDb();

    // Check for duplicate email
    const existing = db.exec('SELECT id FROM students WHERE email = ?', [email]);
    if (existing.length && existing[0].values.length) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    db.run(
      'INSERT INTO students (name, email, dob, department, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, dob, department, phone]
    );
    persist();

    res.status(201).json({ message: 'Student registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// SELECT — retrieve all students
app.get('/api/students', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, name, email, dob, department, phone, created_at FROM students ORDER BY id DESC');

    if (!result.length) return res.json([]);

    const { columns, values } = result[0];
    const rows = values.map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
