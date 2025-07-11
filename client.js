const { DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const qrcode = require("qrcode-terminal");
const config = require("./config.json");
const { ClashClient, loginToCOC } = require("./helpers/auth");

async function connectionLogic() {
    await loginToCOC();

    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const sock = makeWASocket({
        auth: state,
    });

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        const status = lastDisconnect?.error?.output?.statusCode;

        if (connection === "close") {
            const reason = Object.entries(DisconnectReason).find(i => i[1] === status)?.[0] || "unknown";
            console.warn(`[WARN] Closed connection, status: ${reason} (${status})`);
            if (status !== 403) {
                connectionLogic(); // reconnect unless permanently banned
            }
        } else if (connection === "open") {
            console.log("[INFO] Connected to WhatsApp");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("auth.info", saveCreds);

    sock.ev.on("auth.failure", async (failure) => {
        console.error(new Error("[ERROR] Auth failure: " + failure.error));
        if (failure.error === "invalid_session") {
            console.error("[INFO] Invalid session, re-authenticating...");
            await sock.authenticate();
        }
    });

    sock.ev.on("auth.success", async () => {
        console.log("[INFO] Authenticated successfully");
    });

    async function sendError(err, data) {
        let owner = config.developer;
        return await sock.sendMessage(owner + "@s.whatsapp.net", {
            text: "An error occurred! here is the error object:\n\n" + err + "\n\n" + JSON.stringify(data),
        });
    }

    sock.ev.on("groups.upsert", async (groupInfoUpsert) => {
        console.log(groupInfoUpsert);
    });

    sock.ev.on("messages.upsert", async (messageInfoUpsert) => {
        try {
            if (
                !messageInfoUpsert.messages[0].message ||
                messageInfoUpsert.messages[0].key.fromMe
            )
                return;

            let messageText = "";
            const message = messageInfoUpsert.messages[0].message;

            if (message.extendedTextMessage || message.conversation) {
                messageText = (
                    message.extendedTextMessage
                        ? message.extendedTextMessage.text
                        : message.conversation
                ).toLowerCase();
            }

            if (messageText[0] !== config.command_prefix) return;

            const command = messageText.split(" ")[0].slice(1);
            const args = messageText.split(" ").slice(1);
            const {
                key: { participant, remoteJid },
            } = messageInfoUpsert.messages[0];
            const author = (participant || remoteJid)?.split("@")[0];

            const commandFile = require(`./commands/${command}.js`);
            return await commandFile.run(sock, messageInfoUpsert, args, author, ClashClient, sendError);
        } catch (err) {
            if (err.code === "MODULE_NOT_FOUND") return;
            console.log(err);
            return await sendError(err, messageInfoUpsert);
        }
    });
}

connectionLogic();
