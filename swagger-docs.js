/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         points:
 *           type: integer
 *         avatar:
 *           type: string
 *
 *     Match:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         jornada:
 *           type: integer
 *         home:
 *           type: string
 *         away:
 *           type: string
 *         homeScore:
 *           type: integer
 *         awayScore:
 *           type: integer
 *         minute:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, live, finished]
 *         time:
 *           type: string
 *           format: date-time
 *         league:
 *           type: string
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchEvent'
 *
 *     MatchEvent:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         team:
 *           type: string
 *         player:
 *           type: string
 *         minute:
 *           type: integer
 *         score:
 *           type: string
 *
 *     Bet:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         matchId:
 *           type: integer
 *         homeScore:
 *           type: integer
 *         awayScore:
 *           type: integer
 *         pointsEarned:
 *           type: integer
 *         match:
 *           $ref: '#/components/schemas/Match'
 *
 *     ChatMessage:
 *       type: object
 *       properties:
 *         matchId:
 *           type: integer
 *         username:
 *           type: string
 *         text:
 *           type: string
 *         time:
 *           type: string
 *
 *     Player:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         team_name:
 *           type: string
 *         avatar_url:
 *           type: string
 *         goals:
 *           type: integer
 *
 *     Standing:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         strength:
 *           type: integer
 *         pj:
 *           type: integer
 *         pg:
 *           type: integer
 *         pe:
 *           type: integer
 *         pp:
 *           type: integer
 *         gf:
 *           type: integer
 *         gc:
 *           type: integer
 *         pts:
 *           type: integer
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * tags:
 *   - name: Autenticacion
 *   - name: Partidos
 *   - name: Apuestas
 *   - name: Social
 *   - name: Liga
 *   - name: Sistema
 *   - name: Usuario
 *   - name: Chat
 */

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Autenticacion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Usuario registrado
 *
 * /api/login:
 *   post:
 *     summary: Inicia sesion
 *     tags: [Autenticacion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *
 * /api/matches:
 *   get:
 *     summary: Partidos de la jornada actual
 *     tags: [Partidos]
 *     responses:
 *       200:
 *         description: Lista de partidos
 *
 * /api/matches/{id}:
 *   get:
 *     summary: Detalles de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalles del partido
 *
 * /api/bets:
 *   post:
 *     summary: Realiza una apuesta
 *     tags: [Apuestas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, matchId, homeScore, awayScore]
 *             properties:
 *               userId: { type: integer }
 *               matchId: { type: integer }
 *               homeScore: { type: integer }
 *               awayScore: { type: integer }
 *     responses:
 *       200:
 *         description: Apuesta guardada
 *
 * /api/bets/user/{userId}:
 *   get:
 *     summary: Apuestas de un usuario
 *     tags: [Apuestas]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de apuestas
 *
 * /api/leaderboard:
 *   get:
 *     summary: Ranking global
 *     tags: [Social]
 *     responses:
 *       200:
 *         description: Ranking de usuarios
 *
 * /api/league/standings:
 *   get:
 *     summary: Clasificacion de la liga
 *     tags: [Liga]
 *     responses:
 *       200:
 *         description: Tabla de posiciones
 *
 * /api/league/results/{jornada}:
 *   get:
 *     summary: Resultados de una jornada
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: jornada
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Partidos de la jornada
 *
 * /api/teams/{teamName}/players:
 *   get:
 *     summary: Plantilla de un equipo
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: teamName
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de jugadores
 *
 * /api/players/top-scorers:
 *   get:
 *     summary: Pichichi
 *     tags: [Liga]
 *     responses:
 *       200:
 *         description: Goleadores
 *
 * /api/simulation/state:
 *   get:
 *     summary: Estado simulacion
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Jornada actual
 *
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar perfil
 *     tags: [Usuario]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *
 * /api/messages/{matchId}:
 *   get:
 *     summary: Historial de mensajes
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *
 * /api/messages:
 *   post:
 *     summary: Enviar mensaje
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, username, text]
 *             properties:
 *               matchId: { type: integer }
 *               username: { type: string }
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Mensaje enviado
 */
