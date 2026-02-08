require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const db = require('./db');
const SimulationEngine = require('./simulation');

const app = express();

// =====================
// CORS CONFIGURACIÓN
// =====================
const allowedOrigins = [
    'http://localhost:8100', // Ionic dev server
    'https://pr-final-bets-soccer.vercel.app' // Producción
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Responder preflight automáticamente
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// =====================
// MIDDLEWARES
// =====================
app.use(express.json());

// Log de requests
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Inicialización simulación
const sim = new SimulationEngine(null, null);
sim.initialized.then(() => console.log("Simulación inicializada"))
    .catch(err => console.error("Error inicializando simulación:", err));

async function awaitInit(req, res, next) {
    try {
        await sim.initialized;
        next();
    } catch (err) {
        console.error("Solicitud rechazada por inicialización fallida/en curso:", err);
        res.status(503).json({ error: "Servicio inicializándose, por favor reintente", details: err.message });
    }
}

// =====================
// AUTENTICACIÓN JWT
// =====================
const SECRET_KEY = process.env.JWT_SECRET || "mi_clave_secreta_por_defecto_cambiame";

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado" });
        req.user = user;
        next();
    });
}

// =====================
// SWAGGER
// =====================
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: { title: 'BetBuddy API', version: '1.0.0', description: 'API para la app de apuestas BetBuddy' },
        servers: [
            { url: 'http://localhost:3000' },
            { url: 'https://bets-soccer-backend.vercel.app' }
        ],
    },
    apis: [
        path.join(__dirname, 'index.js'),
        path.join(__dirname, 'swagger-docs.js')
    ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
const swaggerUiOptions = {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.css',
    customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js'
    ]
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));

// =====================
// ESQUEMAS ZOD
// =====================
const registerSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(4)
});

const betSchema = z.object({
    userId: z.number().int().positive(),
    matchId: z.number().int().positive(),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0)
});

// =====================
// ROUTES /api
// =====================
app.use('/api', awaitInit);

// REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: "Datos inválidos", details: result.error.format() });

        const { username, email, password } = result.data;

        const checkUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ error: "Email ya registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUserRes = await db.query(
            'INSERT INTO users (username, email, password, points, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [username, email, hashedPassword, 0, "account_circle"]
        );

        const newUser = { ...newUserRes.rows[0] };
        sim.db.users.push({ ...newUser, password: hashedPassword });

        const token = jwt.sign({ id: newUser.id }, SECRET_KEY);
        res.json({ token, user: newUser });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// =====================
// MÁS RUTAS (/api/matches, /api/bets, etc...)
// =====================
// Aquí puedes poner todas tus rutas como antes
// recuérdalo bajo app.use('/api', awaitInit)

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
    console.error(`[Error] ${new Date().toISOString()}:`, err);
    res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? "Algo salió mal" : err.message
    });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor BetBuddy corriendo en http://localhost:${PORT}`));
