const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Render serveri portni tekshirishi uchun HTTP-server
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!');
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Telegram bot tokeningiz
const token = '8920615323:AAFO-JhtcRmnkMj6iAhM1lx2VgnCJq-wrNE';
const bot = new TelegramBot(token, { polling: true });

// O'qituvchi yoki Nazoratchining Telegram Chat ID raqami
// (O'qituvchi botga /start bosganida ushbu ID avtomatik aniqlanadi yoki qo'lda kiritiladi)
let TEACHER_CHAT_ID = null; 

// O'quvchilar ro'yxati va ularning Telegram ma'lumotlari
const studentList = [
    { id: 1, name: "ABDUOLIMOV ASLIDDIN", telegramId: null },
    { id: 2, name: "ABDUVAQQOSOV JASUR", telegramId: null },
    { id: 3, name: "ALMATOV HUSHNUD", telegramId: null },
    { id: 4, name: "ABDUQAHHOROVA MUHLISA", telegramId: null },
    { id: 5, name: "AZAMJONOVA GULSEVAR", telegramId: null },
    { id: 6, name: "ABDUVALIJONOVA HAYOTXON", telegramId: null },
    { id: 7, name: "BOYMATOVA SABINA", telegramId: null },
    { id: 8, name: "BIKULOVA NIGORA", telegramId: null },
    { id: 9, name: "DAVLATALIYEV XUSHNUD", telegramId: null },
    { id: 10, name: "ERMANOV AZIZ", telegramId: null },
    { id: 11, name: "GOFURALIYEV OTABEK", telegramId: null },
    { id: 12, name: "GOFURJONOVA TABASSUM", telegramId: null },
    { id: 13, name: "ISOQOV ASROR", telegramId: null },
    { id: 14, name: "INOMJONOV SANJAR", telegramId: null },
    { id: 15, name: "ISMONOV XURSHID", telegramId: null },
    { id: 16, name: "KURBONALIYEV ELBEK", telegramId: null },
    { id: 17, name: "KUSHMUHAMADOV SHOXRUZBEK", telegramId: null },
    { id: 18, name: "NORMATJONOV ROZIMBEK", telegramId: null },
    { id: 19, name: "OLIMJONOV OROZBEK", telegramId: null },
    { id: 20, name: "RAHIMOV SUHROBJON", telegramId: null },
    { id: 21, name: "UMMATALIYEV PAXLAVON", telegramId: null },
    { id: 22, name: "HOLMATOV SHAHINBEK", telegramId: null },
    { id: 23, name: "MUYSINALIYEVA OYDINOY", telegramId: null }
];

// O'quvchilarning davomat bazasi
const studentsData = {};
studentList.forEach((st) => {
    studentsData[st.id] = {
        name: st.name,
        telegramId: st.telegramId,
        absences: 0,
        fines: 0
    };
});

// Kutayotgan bog'lanishlar (ID biriktirish jarayoni uchun)
const awaitingRegistration = {};

const bootstrap = () => {
    bot.setMyCommands([
        { command: '/start', description: "Botni qayta ishga tushirish" },
        { command: '/register', description: "O'quvchi o'z ID raqamini biriktirishi uchun" },
        { command: '/set_teacher', description: "O'qituvchi profilini biriktirish" },
        { command: '/list', description: "O'quvchilar ro'yxati va ularning Telegram bog'lanishi" },
        { command: '/status', description: "Davomat va jarimalar hisoboti" },
    ]);

    bot.on('message', async (msg) => {
        const text = msg.text ? msg.text.trim() : '';
        const chatId = msg.chat.id;

        // 1. O'qituvchini ro'yxatdan o'tkazish
        if (text === '/set_teacher') {
            TEACHER_CHAT_ID = chatId;
            return bot.sendMessage(chatId, "✅ Siz muvaffaqiyatli **O'qituvchi/Nazoratchi** sifatida belgilandingiz. 3 marta dars qoldirgan o'quvchilar haqida xabarlar sizga keladi.", { parse_mode: 'Markdown' });
        }

        // 2. Start buyrug'i
        if (text === '/start') {
            return bot.sendMessage(
                chatId,
                `Assalomu alaykum!\n` +
                `👮‍♂️ **Nazoratchi:** Islomov Diyorbek\n` +
                `👩‍🏫 **O'qituvchi:** Azizova Zulxumor\n` +
                `👥 **O'quvchilar soni:** ${studentList.length} ta\n\n` +
                `📌 **O'quvchilar uchun:** O'zingizni botga ulash uchun /register buyrug'ini bosing.\n` +
                `👨‍🏫 **O me'yoriy boshqaruv:** O'qituvchi xabarlarni olishi uchun /set_teacher bosing.\n\n` +
                `📋 Ro'yxat: /list | 📊 Hisobot: /status`,
                { parse_mode: 'Markdown' }
            );
        }

        // 3. O'quvchi o'zini ID siga biriktirishi (/register)
        if (text === '/register') {
            awaitingRegistration[chatId] = true;
            return bot.sendMessage(chatId, "Iltimos, ismingiz to'g'risidagi **ID raqamingizni** kiriting (1-23):");
        }

        // Agar foydalanuvchi /register bosgandan keyin ID yuborsa:
        if (awaitingRegistration[chatId]) {
            const studentId = parseInt(text);
            if (studentsData[studentId]) {
                studentsData[studentId].telegramId = chatId;
                delete awaitingRegistration[chatId];
                return bot.sendMessage(chatId, `✅ **${studentsData[studentId].name}**, Telegram akkauntingiz muvaffaqiyatli biriktirildi!`);
            } else {
                return bot.sendMessage(chatId, "❌ Noto'g'ri ID kiritildi. Qaytadan 1 dan 23 gacha bo'lgan ID raqam kiriting:");
            }
        }

        // 4. O'quvchilar ro'yxati
        if (text === '/list') {
            let message = `📋 **SINF O'QUVCHILARI RO'YXATI:**\n\n`;
            for (const id in studentsData) {
                const st = studentsData[id];
                const status = st.telegramId ? "🟢 (Telegram ulangan)" : "🔴 (Telegram ulanmagan)";
                message += `**${id}**. ${st.name} ${status}\n`;
            }
            message += "\n👉 Darsga kelmagan o'quvchining **ID raqamini** yuboring:";
            return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        // 5. Hisobot
        if (text === '/status') {
            let report = `📊 **DAVOMAT VA JARIMALAR HISOBOTI:**\n\n`;
            for (const id in studentsData) {
                const st = studentsData[id];
                report += `👤 **${st.name}**\n❌ Kelmagan: ${st.absences} marta | 🚨 Jarima: ${st.fines} ta\n------------------------------\n`;
            }
            return bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        }

        // 6. ID orqali kelmadi deb belgilash
        if (studentsData[text]) {
            const student = studentsData[text];
            student.absences += 1;

            let response = `❌ **${student.name}** darsga kelmadi deb belgilandi!\nJami dars qoldirgan kunlari: **${student.absences} marta**.\n`;

            // O'quvchining shaxsiy Telegram akkauntiga ogohlantirish yuborish
            if (student.telegramId) {
                bot.sendMessage(
                    student.telegramId,
                    `⚠️ **OGOHLANTIRISH!**\nSiz bu safar darsga kelmadingiz. Sizda jami **${student.absences}-marta** dars qoldirish qayd etildi.`
                ).catch(err => console.log("O'quvchiga xabar yuborishda xatolik:", err));
            }

            // 3 marta va undan oshib ketsa o'qituvchiga xabar yuborish
            if (student.absences >= 3) {
                student.fines += 1;
                response += `\n🚨 **3 TAYDAN OSHDI!** O'qituvchiga avtomatik xabar yuborildi.`;

                if (TEACHER_CHAT_ID) {
                    bot.sendMessage(
                        TEACHER_CHAT_ID,
                        `🚨 **DIQQAT! OGOHLANTIRISH!**\n\nO'quvchi **${student.name}** 3 martadan ko'p dars qoldirdi!\n` +
                        `❌ Jami dars qoldirgan soni: **${student.absences} marta**.`
                    ).catch(err => console.log("O'qituvchiga xabar yuborishda xatolik:", err));
                }
            }

            return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId, "Iltimos, o'quvchi ID raqamini kiriting, /register yoki /list buyrug'idan foydalaning.");
    });
};

bootstrap();
