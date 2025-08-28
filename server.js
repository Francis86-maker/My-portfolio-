const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose
const app = express();
const db = new sqlite3.Database('./database.db');
const saltRounds = 10;
const adminEmail = "francissalvatore86@gmail.com";
const adminPassword = "Fransmine6780";
const port = 4000;
const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, 'uploads/');
},
filename: (req, file, cb) => {
cb(null, Date.now() + '-' + file.originalname);
}
});
const upload = multer({ storage: storage});
app.post('/register',
upload.single('image'), async(req,res) => {
try {
const {username, email, password, confirmPassword }= req.body;
const profileImage = req.file;
if (!username || !email || !password || !confirmPassword || !profileImage)
return res.status(400).json({ message: 'Please fill all fields and upload image'});
if (password.length < 10) {
res.status(400).json({ message: 'Password must contain atleast 10 characters' });
}
if (password !== confirmPassword) {
res.status(400).json({ message: 'Password doesn't match'});
}
const hashedPassword = await
bcrypt.hash(password, saltRounds);
db.get(SELECT*FROM users WHERE email = ?, [email], async(err, existingUser) => {
if (err) return res.status(500).json({ message: 'Database error'});
if (existingUser) return res.status(400).json({ message: 'Email already exists.'});
db.run(INSERT INTO users (username, email, password, imagePath) VALUES(?,?,?,?), [username, email, hashedPassword, profileImage ? profileImage.path: null], async function(err) {
if (err) return res.status(500).json({ message: 'Error registering user.'});
res.json({ message: 'User registered successfully', userId: this.lastID});
}
} catch(error) {
res.status(500).json({ message: 'Server error'});
}
});
app.post('/login', async(req,res) => {
const {email, password} = req.body;
if (!email || !password) {
return res.status(400).json({ message: 'Email and password are required.'});
}
db.get(SELECT*FROM users WHERE email = ?, [email], async(err, user) => {
if (err) {
return res.status(500).json({ message: 'Error logging user.'});
}
if (!user) {
return res.status(401).json({ message: 'Invalid email or password'});
}
const isMatch = await
bcrypt.compare(password,user.password);
if (!isMatch) {
return res.status(401).json({ message: 'Invalid email or password'});
}
const token = jwt.sign( {id: user.id, email: user.email, username: user.username},
"your_secret_key",
{expiresIn: '1h'}
);
res.json({ 'Login successfully', token, userId: this.lastID});
});
});
function authenticateToken(req,res,next) {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
const secretKey = "your_secret_key"
jwt.verify(token, secretKey, (err, user) => {
if (err) {
return res.status(403).json({ message: 'Token Invalid'});
}
req.user = user;
next();
});
});
app.post('/admin/login', async(req,res) => {
const {email, password} = req.body;
if (!email || !password) {
return res.status(400).json({ message: 'Email and password are required.'});
}
db.get(SELECT*FROM admins WHERE email = ?, [email], async(err, admin) => {
if (err) return res.status(500).json({ message: 'Database error'});
if (!admin) {
return res.status(401).json({ message: 'Invalid email or password'});
}
const isMatch = await
bcrypt.compare(password,admin.password);
if (!isMatch) {
return res.status(401).json({ message: 'Invalid email or password'});
}
res.json({ 'Login successfully', adminId: this.lastID});
});
});
app.post('/product',
upload.single('image'),async(req,res) => {
const {name, description,price, category, stock } =
req.body;
const productImage = req.file;
if (!name || !price) {
return res.status(400).json({ message: 'Product name and price are required.'});
}
const sql = INSERT INTO products (name, description, price, category, stock, imagePath) VALUES(?,?,?,?,?,?), [name, description,price, category, stock, productImage ? productImage.path: null], function(err) {
if (err) return res.status(500).json({ message: 'Error creating product'});
res.json({ message: 'Product  created successfully'});
});
}
app.get('/product/:id', (req,res) => {
const {id} = req.params;
db.get(SELECT*FROM products WHERE id = ?,[id], (err, product) => {
if (err) return res.status(500).json({ message: 'Database error'});
if (!product) {
return res.status(401).json({ message: 'Product not found'});
}
});
app.get('/products', (req,res) => {
const sql =SELECT*FROM products;
db.all(sql,[],(err,rows) => {
if(err) {
return res.status(500).json({ message: 'Database error'});
}
if (!rows) return res.status(401).json({ message: 'Products not found'});
}
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
