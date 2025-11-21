
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = "bytebridge-secret-key-2024";
// Hardcoded API key (in production, store securely)
const API_KEY = "bytebridge-api-key-12345";

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Authentication Middleware
function authenticateToken(req, res, next) {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'];
  if (apiKey === API_KEY) {
    return next();
  }

  // Check for Bearer token in Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token or API key provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

// Login endpoint (no authentication required) - must be before static files
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Simple hardcoded credentials (in production, use database)
  if (username === "admin" && password === "password123") {
    const token = jwt.sign(
      { username: username, id: 1 },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      message: "Login successful",
      token: token,
      apiKey: API_KEY // Also return API key for testing
    });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// Serve static files (HTML, CSS, JS) - after API routes
app.use(express.static('.'));

let tasks = [
  { id: 1, title: "Review company emails", completed: false },
  { id: 2, title: "Prepare morning report", completed: true },
  { id: 3, title: "Update API documentation for Part 1", completed: true },
  { id: 4, title: "Fix UI bug in Task Manager dashboard", completed: false },
  { id: 5, title: "Attend ByteBridge onboarding training", completed: true }
];

let nextId = 6; 


// Protected routes - require authentication
app.get("/tasks", authenticateToken, (req, res) => {
  res.json(tasks);
});


app.post("/tasks", authenticateToken, (req, res) => {
  const { title, completed = false } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Task title is required." });
  }

  const task = { id: nextId++, title: title.trim(), completed: Boolean(completed) };
  tasks.push(task);

  res.status(201).json(task);
});

app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);

  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  const deleted = tasks.splice(index, 1)[0];
  res.json({ message: "Task deleted", task: deleted });
});

app.listen(port, () => {
  console.log(`ByteBridge Task API running at http://localhost:${port}`);
});
