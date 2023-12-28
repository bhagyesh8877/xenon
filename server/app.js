const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Bhagyesh@1234',
    database: 'task',
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL');
});


app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../public')));


const checkLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/login.html');
    }
};


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            const user = results[0];

            
            bcrypt.compare(password, user.password, (err, passwordMatch) => {
                if (err) {
                    throw err;
                }

                if (passwordMatch) {
                    
                    req.session.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    };

                    res.json({ success: true, message: 'Login successful' });
                } else {
                    res.json({ success: false, message: 'Invalid credentials' });
                }
            });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});


app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            throw err;
        }

       
        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                throw err;
            }

            res.json({ success: true, message: 'Registration successful' });
        });
    });
});


app.post('/contact', checkLoggedIn, (req, res) => {
    const { name, email, message } = req.body;

    const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    db.query(sql, [name, email, message], (err, result) => {
        if (err) {
            throw err;
        }
        console.log('Contact form data inserted');
        res.json({ success: true, message: 'Form submitted successfully' });
    });
});


app.get('/logout', (req, res) => {
    if (req.session && req.session.user) {
        req.session.destroy((err) => {
            if (err) {
                throw err;
            }
            res.json({ success: true, message: 'Logout successful' });
        });
    } else {
        res.json({ success: false, message: 'No active session' });
    }
});


app.get('/home', checkLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard', checkLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
