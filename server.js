const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const supabase = require('./supabaseClient');

const app = express();

// Enable CORS for all local origin connections
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Session Middleware Setup
app.use(session({
    secret: 'campus_mystery_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Serve static files (HTML, CSS, images, JS) directly from the current directory
app.use(express.static(__dirname));

// Serve index.html as the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. SIGN UP ROUTE
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if account already exists
        const { data: existingUser, error: searchError } = await supabase
            .from('logins')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (searchError) throw searchError;

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Account already exists! Please sign in.' });
        }

        // Insert new user into database
        const { error: insertError } = await supabase
            .from('logins')
            .insert([{ email, password }]);

        if (insertError) throw insertError;

        // Establish user session
        req.session.user = { email };
        req.session.isLoggedIn = true;

        res.json({ success: true, message: 'Account created successfully' });

    } catch (err) {
        console.error('SERVER SIGNUP ERROR:', err.message || err);
        res.status(500).json({ success: false, message: err.message || 'Database error during sign up' });
    }
});

// 2. SIGN IN ROUTE
app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query user using maybeSingle() to safely handle zero or non-matching records
        const { data: user, error } = await supabase
            .from('logins')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .maybeSingle();

        if (error) throw error;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Establish session on valid credentials
        req.session.user = { email: user.email };
        req.session.isLoggedIn = true;

        res.json({ success: true, message: 'Logged in successfully' });

    } catch (err) {
        console.error('SERVER SIGNIN ERROR:', err.message || err);
        res.status(500).json({ success: false, message: err.message || 'Database error during sign in' });
    }
});

// 3. CHECK AUTH ROUTE
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.isLoggedIn) {
        res.json({ isLoggedIn: true, user: req.session.user });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// 4. LOGOUT ROUTE
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Dynamic port allocation for hosting platforms like Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));