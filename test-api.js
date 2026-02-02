/**
 * SCRIPT DE TEST INTEGRAL PARA BETBUDDY API
 * Ejecutar con: node test-api.js
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('🚀 Iniciando tests de integración de BetBuddy API...\n');

    let testUser = {
        username: 'tester_' + Math.floor(Math.random() * 1000),
        email: `test_${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'password123'
    };

    let token = '';
    let userId = null;
    let matchId = 1; // Asumimos que existe tras el init de la simulación

    // --- 1. TEST REGISTRO ---
    console.log('--- [TEST REGISTRO] ---');

    // Caso de éxito
    const regRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    if (regRes.status === 200 && regData.token) {
        console.log('✅ Registro exitoso');
        token = regData.token;
        userId = regData.user.id;
    } else {
        console.error('❌ Falló registro exitoso', regData);
    }

    // Caso: Email duplicado
    const regDupRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    if (regDupRes.status === 400) {
        console.log('✅ Control de email duplicado correcto (400)');
    } else {
        console.error('❌ Falló control de email duplicado');
    }

    // Caso: Datos inválidos (Zod)
    const regInvRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'no-es-email' })
    });
    if (regInvRes.status === 400) {
        console.log('✅ Control de validación Zod correcto (400)');
    } else {
        console.error('❌ Falló control de validación Zod');
    }

    // --- 2. TEST LOGIN ---
    console.log('\n--- [TEST LOGIN] ---');

    // Caso: Credenciales correctas
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    if (loginRes.status === 200) {
        console.log('✅ Login exitoso');
    } else {
        console.error('❌ Falló login exitoso');
    }

    // Caso: Password incorrecto
    const loginErrRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: 'wrongpassword' })
    });
    if (loginErrRes.status === 401) {
        console.log('✅ Control de credenciales inválidas correcto (401)');
    } else {
        console.error('❌ Falló control de credenciales inválidas');
    }

    // --- 3. TEST PARTIDOS Y LIGA ---
    console.log('\n--- [TEST PARTIDOS Y LIGA] ---');

    const matchesRes = await fetch(`${BASE_URL}/matches`);
    if (matchesRes.status === 200) {
        const matches = await matchesRes.json();
        console.log(`✅ Obtención de partidos correcta (${matches.length} partidos)`);
        // Buscar el primer partido pendiente para el test de apuestas
        const pendingMatch = matches.find(m => m.status === 'pending');
        if (pendingMatch) {
            matchId = pendingMatch.id;
            console.log(`ℹ️ Usando Match ID ${matchId} (PENDING) para los tests`);
        } else {
            matchId = matches[0].id;
            console.log(`⚠️ No hay partidos PENDING, usando Match ID ${matchId} (${matches[0].status})`);
        }
    }

    const standingsRes = await fetch(`${BASE_URL}/league/standings`);
    if (standingsRes.status === 200) {
        console.log('✅ Obtención de clasificación correcta');
    }

    // --- 4. TEST APUESTAS (PROTEGIDAS) ---
    console.log('\n--- [TEST APUESTAS] ---');

    // Caso: Sin token
    const betNoTokenRes = await fetch(`${BASE_URL}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, matchId, homeScore: 2, awayScore: 1 })
    });
    if (betNoTokenRes.status === 401) {
        console.log('✅ Bloqueo sin token correcto (401)');
    }

    // Caso: Éxito
    const betRes = await fetch(`${BASE_URL}/bets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, matchId, homeScore: 2, awayScore: 1 })
    });
    if (betRes.status === 200) {
        console.log('✅ Apuesta realizada con éxito');
    } else {
        const errData = await betRes.json();
        console.error('❌ Falló apuesta legítima', errData);
    }

    // Caso: Apostar para OTRO usuario (403)
    const betOtherRes = await fetch(`${BASE_URL}/bets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: 99999, matchId, homeScore: 1, awayScore: 1 })
    });
    if (betOtherRes.status === 403) {
        console.log('✅ Bloqueo de usuario usurpador correcto (403)');
    }

    // --- 5. TEST CHAT ---
    console.log('\n--- [TEST CHAT] ---');

    // Caso: Enviar mensaje éxito
    const chatMsgRes = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, username: testUser.username, text: '¡Vamos Equipo!' })
    });
    if (chatMsgRes.status === 200) {
        console.log('✅ Envío de mensaje de chat correcto');
    }

    // Caso: Mensaje vacío (Error 400 - Nuevo control de robustez)
    const chatEmptyRes = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, username: testUser.username, text: '' })
    });
    if (chatEmptyRes.status === 400) {
        console.log('✅ Control de mensaje vacío correcto (400)');
    }

    // Caso: Historial de mensajes
    const chatHistRes = await fetch(`${BASE_URL}/messages/${matchId}`);
    if (chatHistRes.status === 200) {
        const msgs = await chatHistRes.json();
        console.log(`✅ Obtención de historial correcta (${msgs.length} mensajes)`);
    }

    // --- 6. TEST ROBUSTEZ EXTREMA (Error Handler Global) ---
    console.log('\n--- [TEST ROBUSTEZ] ---');
    const errorGlobalRes = await fetch(`${BASE_URL}/messages/id-invalido-que-provoca-error`);
    if (errorGlobalRes.status === 400) {
        console.log('✅ Manejo de ID inválido correcto (400)');
    }

    console.log('\n✨ Todos los tests completados.');
}

runTests().catch(err => {
    console.error('💥 Error crítico ejecutando los tests:', err);
});
