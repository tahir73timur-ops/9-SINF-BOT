const TelegramBot = require('8920615323:AAHEuBC-NeqATih-Bu0BFAMmJFXCVH9Mmqs');
const http = require('http');

// Render serveri uchun HTTP-server (24/7 rejim)
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot 24/7 ishlamoqda!');
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = '8920615323:AAFO-JhtcRmnkMj6iAhM1lx2VgnCJq-wrNE';
const bot = new TelegramBot(token, { polling: true });

// Faqat 2 ta mas'ul kuzatuvchi (Islomov Diyorbek va Azizova Zulxumor)
// Har biringiz botga bir marta /set_admin deb yozsangiz, ID-ingiz saqlanadi
const ADMIN_IDS = []; 

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
    { command: '/set_admin', description: "Kuzatuvchi/Admin sifatida ulanish" },
    { command: '/register', description: "O'quvchini ulash" },
    { command: '/list', description: "O'quvchilar ro'yxati" },
    { command: '/status', description: "Davomat hisoboti" }
]);

bot.on('message', async (msg) => {
    const text = msg.text ? msg.text.trim() : '';
    const chatId = msg.chat.id;

    // 1. Admin/Kuzatuvchi biriktirish (Faqat 2 kishi qo'shila oladi)
    if (text === '/set_admin') {
        if (!ADMIN_IDS.includes(chatId)) {
            if (ADMIN_IDS.length < 2) {
                ADMIN_IDS.push(chatId);
                return bot.sendMessage(chatId, "✅ Siz **mas'ul kuzatuvchi** sifatida biriktirildingiz!");
            } else {
                return bot.sendMessage(chatId, "⚠️ 2 ta kuzatuvchi allaqachon biriktirilgan (Islomov Diyorbek va Azizova Zulxumor).");
            }
        } else {
            return bot.sendMessage(chatId, "ℹ️ Siz allaqachon kuzatuvchisiz.");
        }
    }

    // 2. Start buyrug'i (Hamma uchun ko'rinadi)
    if (text === '/start') {
        return bot.sendMessage(
            chatId,
            `Assalomu alaykum!\n` +
            `👮‍♂️ **Nazoratchi:** Islomov Diyorbek\n` +
            `👩‍🏫 **O'qituvchi:** Azizova Zulxumor\n\n` +
            `📋 /list - O'quvchilar ro'yxati\n` +
            `📌 /register - O'quvchi profilini ulash\n` +
            `🔑 /set_admin - Kuzatuvchi profilini ulash\n` +
            `📊 /status - Davomat hisoboti`,
            { parse_mode: 'Markdown' }
        );
    }

    // 3. O'quvchilar registratsiyasi (/register)
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

    // --- QUYIDAGI BUYRUQLAR FAQAT 2 TA KUZATUVCHI (ADMIN) UCHUN ISHLAYDI ---
    if (!ADMIN_IDS.includes(chatId)) {
        return bot.sendMessage(chatId, "⛔️ Kechirasiz, davomatni belgilash va ko'rish faqat mas'ul kuzatuvchilar uchun ajratilgan.");
    }

    if (text === '/list') {
        let message = `📋 **O'QUVCHILAR RO'YXATI:**\n\n`;
        for (const id in studentsData) {
            const st = studentsData[id];
            const status = st.telegramId ? "🟢 (Ulangan)" : "🔴 (Ulanmagan)";
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

    // ID yuborilganda kelmadi deb belgilash
    if (studentsData[text]) {
        const student = studentsData[text];
        student.absences += 1;
        let response = `❌ **${student.name}** darsga kelmadi deb belgilandi! (Jami: ${student.absences} marta)\n`;

        // O'quvchining shaxsiy Telegramiga xabar yuborish
        if (student.telegramId) {
            bot.sendMessage(student.telegramId, `⚠️ **OGOHLANTIRISH!** Siz bugun darsga kelmadingiz. Jami dars qoldirganingiz: ${student.absences} marta.`).catch(() => {});
        }

        // 3 marta va undan oshib ketsa mas'ullarga xabar yuborish
        if (student.absences >= 3) {
            student.fines += 1;
            response += `\n🚨 **3 TAYDAN OSHDI!** Mas'ullarga ogohlantirish yuborildi.`;
            ADMIN_IDS.forEach(adminId => {
                bot.sendMessage(adminId, `🚨 **DIQQAT!** O'quvchi **${student.name}** 3 martadan ko'p dars qoldirdi! (Jami: ${student.absences} marta)`).catch(() => {});
            });
        }
        return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }
});
