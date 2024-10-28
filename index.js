const { default: makeWASocket, useMultiFileAuthState } = require('@whiskysockets/baileys');
const qrcode = require('qrcode-terminal'); // Import the qrcode-terminal package

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            startBot(); // Attempt to reconnect
        } else if (connection === 'open') {
            console.log('Bot is ready!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const chatId = msg.key.remoteJid;
            const replyMessage = `You said: ${msg.message.conversation}`;

            await sock.sendMessage(chatId, { text: replyMessage });
        }
    });

    // QR Code generation
    sock.ev.on('chats.set', async () => {
        const qrCode = await sock.getQrCode();
        qrcode.generate(qrCode, { small: true }); // Generate and display QR code
    });
}

startBot();
