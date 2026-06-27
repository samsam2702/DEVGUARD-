import express from "express"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createClient } from "@libsql/client"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const JWT_SECRET = "devguard_secret_key_2024"

// DB setup - file-based SQLite
const db = createClient({
  url: `file:${path.join(__dirname, "devguard.db")}`
})

async function initDB() {
  await db.execute(`CREATE TABLE IF NOT EXISTS employee_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS hr_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    email TEXT,
    join_date TEXT,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  console.log("✅ Database ready")
}

app.use(cors({ origin: "*" }))
app.use(express.json())

// ── Employee Auth ─────────────────────────────────────────────────────────────
app.post("/api/employee/signup", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: "Username and password required" })
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" })
  try {
    const hashed = await bcrypt.hash(password, 10)
    await db.execute({ sql: "INSERT INTO employee_accounts (username, password) VALUES (?, ?)", args: [username.toLowerCase(), hashed] })
    const token = jwt.sign({ username: username.toLowerCase(), role: "employee" }, JWT_SECRET, { expiresIn: "7d" })
    res.json({ token, username })
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ error: "Username already exists" })
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/employee/signin", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: "Username and password required" })
  try {
    const result = await db.execute({ sql: "SELECT * FROM employee_accounts WHERE username = ?", args: [username.toLowerCase()] })
    const account = result.rows[0]
    if (!account) return res.status(401).json({ error: "No account found. Please sign up first." })
    const valid = await bcrypt.compare(password, account.password)
    if (!valid) return res.status(401).json({ error: "Incorrect password. Please try again." })
    const token = jwt.sign({ username: account.username, role: "employee" }, JWT_SECRET, { expiresIn: "7d" })
    res.json({ token, username: account.username })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── HR Auth ───────────────────────────────────────────────────────────────────
app.post("/api/hr/signup", async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" })
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" })
  try {
    const hashed = await bcrypt.hash(password, 10)
    await db.execute({ sql: "INSERT INTO hr_accounts (name, email, password) VALUES (?, ?, ?)", args: [name, email.toLowerCase(), hashed] })
    const token = jwt.sign({ email: email.toLowerCase(), name, role: "hr" }, JWT_SECRET, { expiresIn: "7d" })
    res.json({ token, email, name })
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ error: "Email already registered" })
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/hr/signin", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: "Email and password required" })
  try {
    const result = await db.execute({ sql: "SELECT * FROM hr_accounts WHERE email = ?", args: [email.toLowerCase()] })
    const account = result.rows[0]
    if (!account) return res.status(401).json({ error: "No account found. Please sign up first." })
    const valid = await bcrypt.compare(password, account.password)
    if (!valid) return res.status(401).json({ error: "Incorrect password. Please try again." })
    const token = jwt.sign({ email: account.email, name: account.name, role: "hr" }, JWT_SECRET, { expiresIn: "7d" })
    res.json({ token, email: account.email, name: account.name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Employees CRUD ────────────────────────────────────────────────────────────
app.get("/api/employees", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM employees ORDER BY created_at DESC")
    res.json(result.rows.map((e) => ({
      id: e.id, employeeId: e.employee_id, name: e.name,
      role: e.role, department: e.department, email: e.email,
      joinDate: e.join_date, username: e.username
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/employees", async (req, res) => {
  const { id, employeeId, name, role, department, email, joinDate, username } = req.body
  try {
    await db.execute({
      sql: "INSERT INTO employees (id, employee_id, name, role, department, email, join_date, username) VALUES (?,?,?,?,?,?,?,?)",
      args: [id, employeeId, name, role, department, email, joinDate, username ?? ""]
    })
    res.json({ success: true })
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ error: "Employee ID already exists" })
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/employees/:id", async (req, res) => {
  const { employeeId, name, role, department, email, joinDate, username } = req.body
  try {
    await db.execute({
      sql: "UPDATE employees SET employee_id=?, name=?, role=?, department=?, email=?, join_date=?, username=? WHERE id=?",
      args: [employeeId, name, role, department, email, joinDate, username ?? "", req.params.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/employees/:id", async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM employees WHERE id = ?", args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start server
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 DevGuard backend on http://localhost:${PORT}`))
}).catch(console.error)
