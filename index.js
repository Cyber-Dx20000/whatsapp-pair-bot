const { makeWASocket, useMultiFileAuthState, Browsers, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        auth: state
    });

    // Pair Code ජනනය වීම සහ සම්බන්ධ වීම
    if (!sock.authState.creds.registered) {
        // මහිදී ඔබට Pair Code එකක් Terminal එකන් ලබගත හක
        setTimeout(async () => {
            const code = await sock.requestPairingCode("947xxxxxxxxx"); // ඔබග WhatsApp අකය මහි ඇතුළත් කරන්න (රට කතය සමඟ)
            console.log(`Your Pairing Code is: ${code}`);
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('WhatsApp Bot successfully connected!');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 403;
            if (shouldReconnect) {
                startBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // පණිවිඩ ලබන විට ක්රියත්මක වන කටස
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // සරල Test Command එකක්
        if (text === '!ping') {
            await sock.sendMessage(from, { text: 'Pong! Bot is working perfectly. 🚀' }, { quoted: msg });
        }
    });
}


