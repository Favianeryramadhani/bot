module.exports = {
    name: 'warlog',
    description: 'Get war log of a clan',
    usage: '<clan tag>',
    run: async (sock, messageInfoUpsert, args, author, cocClient, sendError) => {
        var send = await sock.sendMessage(messageInfoUpsert.messages[0].key.remoteJid, {text: "Fetching war log..."});
        try {
            if (!args[0]) {
                return await sock.sendMessage(messageInfoUpsert.messages[0].key.remoteJid, {
                    text: "Please provide a clan tag!",
                    edit: send.key
                });
            }

            var clanTag = args[0].toUpperCase();
            var warLog = await cocClient.getClanWarLog(clanTag);

            if (!warLog || warLog.length === 0) {
                return await sock.sendMessage(messageInfoUpsert.messages[0].key.remoteJid, {
                    text: "No war log data found!",
                    edit: send.key
                });
            }

            let warText = `📜 War Log for Clan ${clanTag}\n\n`;
            for (let i = 0; i < Math.min(warLog.length, 5); i++) { // Limit to last 5 wars
                const war = warLog[i];
                const result = war.result || 'Unknown';
                warText += `⚔️ War ${i + 1}:\n`;
                warText += `Opponent: ${war.opponent?.name || 'N/A'}\n`;
                warText += `Result: ${result}\n`;
                warText += `Our Stars: ${war.clan?.stars ?? '-'}, Their Stars: ${war.opponent?.stars ?? '-'}\n`;
                warText += `Our Destruction: ${war.clan?.destructionPercentage ?? '-'}%, Their Destruction: ${war.opponent?.destructionPercentage ?? '-'}%\n\n`;
            }

            return await sock.sendMessage(messageInfoUpsert.messages[0].key.remoteJid, {
                text: warText,
                edit: send.key
            });

        } catch (err) {
            console.log(err);
            await sock.sendMessage(messageInfoUpsert.messages[0].key.remoteJid, {
                text: "An error occurred! Here is the error object:\n\n" + err,
                edit: send.key
            });
            return await sendError(err, messageInfoUpsert);
        }
    }
}
