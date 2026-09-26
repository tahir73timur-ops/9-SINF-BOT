const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Render serveri uchun HTTP-server
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot 24/7 ishlamoqda!');
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = '8920615323:AAFO-JhtcRmnkMj6iAhM1lx2VgnCJq-wrNE';
const bot = new TelegramBot(token, { polling: true });

let TEACHER_CHAT_ID = null;

const studentList = [
    "ABDUOLIMOV ASLIDDIN", "ABDUVAQQOSOV JASUR", "ALMATOV HUSHNUD",
    "ABDUQAHHOROVA MUHLISA", "AZAMJONOVA GULSEVAR", "ABDUVALIJONOVA HAYOTXON",
    "BOYMATOVA SABINA", "BIKULOVA NIGORA", "DAVLATALIYEV XUSHNUD",
    "ERMANOV AZIZ", "GOFURALIYEV OTABEK", "GOFURJONOVA TABASSUM",
    "ISOQOV ASROR", "INOMJONOV SANJAR", "ISMONOV XURSHID",
    "KURBONALIYEV ELBEK", "KUSHMUHAMADOV SHOXRUZBEK", "NORMATJONOV ROZIMBEK",
    "OLIMJONOV OROZBEK", "RAHIMOV SUHROBJON", "UMMATALIYEV PAXLAVON",
    "HOLMATOV SHAHINBEK", "MUYSINALIYEVA OYDINOY"
];

const studentsData = {};
studentList.forEach((name, index) => {
    studentsData[index + 1] = { name: name, telegramId: null, absences: 0, fines: 0 };
});

const awaitingRegistration = {};

bot.setMyCommands([
    { command: '/start', description: "Botni qayta ishga tushirish" },
    { command: '/register', description: "O'quvchini ulash" },
    { command: '/set_teacher', description: "O'qituvchini ulash" },
    { command: '/list', description: "O'quvchilar ro'yxati" },
    { command: '/status', description: "Davomat hisoboti" }
]);

bot.on('message', async (msg) => {
    const text = msg.text ? msg.text.trim() : '';
    const chatId = msg.chat.id;

    if (text === '/set_teacher') {
        TEACHER_CHAT_ID = chatId;
        return bot.sendMessage(chatId, "✅ Siz muvaffaqiyatli **O'qituvchi/Nazoratchi** sifatida belgilandingiz.");
    }

    if (text === '/start') {
        return bot.sendMessage(
            chatId,
            `Assalomu alaykum!\n` +
            `👮‍♂️ **Nazoratchi:** Islomov Diyorbek\n` +
            `👩‍🏫 **O'qituvchi:** Azizova Zulxumor\n\n` +
            `📋 /list - O'quvchilar ro'yxati\n` +
            `📌 /register - O'quvchi profilini ulash\n` +
            `👨‍🏫 /set_teacher - O'qituvchi profilini ulash\n` +
            `📊 /status - Davomat hisoboti`,
            { parse_mode: 'Markdown' }
        );
    }

    if (text === '/register') {
        awaitingRegistration[chatId] = true;
        return bot.sendMessage(chatId, "Iltimos, ismingiz to'g'risidagi **ID raqamingizni** kiriting (1-23):");
    }

    if (awaitingRegistration[chatId]) {
        const id = parseInt(text);
        if (studentsData[id]) {
            studentsData[id].telegramId = chatId;
            delete awaitingRegistration[chatId];
            return bot.sendMessage(chatId, `✅ **${studentsData[id].name}**, Telegram akkauntingiz muvaffaqiyatli biriktirildi!`);
        } else {
            return bot.sendMessage(chatId, "❌ Noto'g'ri ID. 1 dan 23 gacha bo'lgan raqam kiriting:");
        }
    }

    if (text === '/list') {
        let message = `📋 **O'QUVCHILAR RO'YXATI:**\n\n`;
        for (const id in studentsData) {
            const st = studentsData[id];
            const status = st.telegramId ? "🟢 (Telegram ulangan)" : "🔴 (Telegram ulanmagan)";
            message += `**${id}**. ${st.name} ${status}\n`;
        }
        message += "\n👉 Darsga kelmagan o'quvchining **ID raqamini** yuboring:";
        return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    if (text === '/status') {
        let report = `📊 **DAVOMAT VA JARIMALAR HISOBOTI:**\n\n`;
        for (const id in studentsData) {
            const st = studentsData[id];
            report += `👤 **${st.name}**\n❌ Kelmagan: ${st.absences} marta | 🚨 Jarima: ${st.fines} ta\n------------------------------\n`;
        }
        return bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    }

    if (studentsData[text]) {
        const student = studentsData[text];
        student.absences += 1;
        let response = `❌ **${student.name}** darsga kelmadi deb belgilandi! (Jami: ${student.absences} marta)\n`;

        if (student.telegramId) {
            bot.sendMessage(student.telegramId, `⚠️ **OGOHLANTIRISH!** Siz bugun darsga kelmadingiz. Jami dars qoldirganingiz: ${student.absences} marta.`).catch(() => {});
        }

        if (student.absences >= 3) {
            student.fines += 1;
            response += `\n🚨 **3 TAYDAN OSHDI!** O'qituvchiga xabar yuborildi.`;
            if (TEACHER_CHAT_ID) {
                bot.sendMessage(TEACHER_CHAT_ID, `🚨 **DIQQAT!** O'quvchi **${student.name}** 3 martadan ko'p dars qoldirdi! (Jami: ${student.absences} marta)`).catch(() => {});
            }
        }
        return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }
});
