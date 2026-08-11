const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');
const recordRoutes = require('./routes/recordRoutes');
const attendanceRoutes = require('./routes/attendance');

const app = express();

// Attach CORS headers to all responses, including error responses.
app.use(cors());

const allowedOrigins = [
    'https://e-index-1.onrender.com',
    'https://e-indexx-1.onrender.com',
    'https://eindexx-1.onrender.com',
    'https://eindexki.onrender.com',
    'https://eindex-esrn.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend is running' });
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/attendance', attendanceRoutes);

// Static file serving
app.use('/', express.static(path.join(__dirname, '../../')));

// Catch-all route for SPA - Must come after API routes and static files
app.get('*', (req, res) => {
    // Only send index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../../index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

async function seedSubjects() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM subjects');
        if (rows[0].count === 0) {
            await pool.query(
                'INSERT INTO subjects (code, teacher) VALUES ?',
                [[
                    ['IT223', 'Ms. Garcia'],
                    ['IT221', 'Mr. Santos']
                ]]
            );
            console.log('Seeded subjects table');
        }
    } catch (error) {
        console.error('Error seeding subjects:', error);
    }
}

function startServer(port) {
    const server = app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);
        try {
            await initializeDatabase();
            await seedSubjects();
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            console.warn(`Port ${port} is already in use. Trying ${nextPort} instead.`);
            startServer(nextPort);
            return;
        }

        console.error('Server failed to start:', error);
        process.exit(1);
    });
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
startServer(PORT); 