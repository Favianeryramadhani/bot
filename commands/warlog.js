const moment = require('moment'); // pastikan kamu install moment: npm install moment

module.exports = {
    name: 'warlog',
    description: 'Get war log of a clan',
    usage: '<clan tag>',
    run: async (sock, messageInfoUpsert, args, author, cocClient, sendError) => {
        const jid = messageInfoUpsert.messages[0].key.remoteJid;
        const send = await sock.sendMessage(jid, { text: "Fetching war log..." });

        try {
            if (!args[0]) {
                return await sock.sendMessage(jid, {
                    text: "Please provide a clan tag!",
                    edit: send.key
                });
            }

            const clanTag = args[0].toUpperCase();
            const warLog = await cocClient.getClanWarLog(clanTag);

            if (!warLog || warLog.length === 0) {
                return await sock.sendMessage(jid, {
                    text: "No war log data found or war log is private!",
                    edit: send.key
                });
            }

            for (let i = 0; i < Math.min(warLog.length, 3); i++) { // Ambil max 3 war
                const war = warLog[i];
                const result = war.result || 'Unknown';
                const opponentName = war.opponent?.name || 'Unknown Opponent';
                const ourStars = war.clan?.stars ?? '-';
                const theirStars = war.opponent?.stars ?? '-';

                const ourBadge = war.clan?.badgeUrls?.small || null;
                const theirBadge = war.opponent?.badgeUrls?.small || null;

                const warEndTime = war.endTime ? moment(war.endTime, 'YYYYMMDDTHHmmss.SSSZ').format('DD MMM YYYY HH:mm') : 'Unknown Time';

                const caption = 
`⚔️ War ${i + 1}
📅 Ended: ${warEndTime}
🆚 Opponent: ${opponentName}
🏆 Result: ${result}
⭐ Stars: Us ${ourStars} vs Them ${theirStars}`;

                // Kirim badge musuh + informasi
                await sock.sendMessage(jid, {
                    image: { url: theirBadge },
                    caption: caption,
                    edit: send.key
                });
            }

        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, {
                text: "An error occurred! Here is the error object:\n\n" + err,
                edit: send.key
            });
            return await sendError(err, messageInfoUpsert);
        }
    }
}
