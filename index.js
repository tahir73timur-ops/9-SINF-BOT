const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Render serveri portni tekshirishi uchun oddiy HTTP-server
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

// O'quvchilar ro'yxati (23 ta o'quvchi)
const studentList = [
    "ABDUOLIMOV ASLIDDIN",
    "ABDUVAQQOSOV JASUR",
    "ALMATOV HUSHNUD",
    "ABDUQAHHOROVA MUHLISA",
    "AZAMJONOVA GULSEVAR",
    "ABDUVALIJONOVA HAYOTXON",
    "BOYMATOVA SABINA",
    "BIKULOVA NIGORA",
    "DAVLATALIYEV XUSHNUD",
    "ERMANOV AZIZ",
    "GOFURALIYEV OTABEK",
    "GOFURJONOVA TABASSUM",
    "ISOQOV ASROR",
    "INOMJONOV SANJAR",
    "ISMONOV XURSHID",
    "KURBONALIYEV ELBEK",
    "KUSHMUHAMADOV SHOXRUZBEK",
    "NORMATJONOV ROZIMBEK",
    "OLIMJONOV OROZBEK",
    "RAHIMOV SUHROBJON",
    "UMMATALIYEV PAXLAVON",
    "HOLMATOV SHAHINBEK",
    "MUYSINALIYEVA OYDINOY"
];

// O'quvchilar davomati va jarimalari
const studentsData = {};

studentList.forEach((name, index) => {
    studentsData[index + 1] = {
        name: name,
        absences: 0,
        fines: 0
    };
});

const bootstrap = () => {
    bot.setMyCommands([
        { command: '/start', description: "Botni qayta ishga tushirish" },
        { command: '/list', description: "O'quvchilar ro'yxati (23 ta)" },
        { command: '/status', description: "Davomat va jarimalar hisoboti" },
    ]);

    bot.on('message', async (msg) => {
        const text = msg.text ? msg.text.trim() : '';
        const chatId = msg.chat.id;

        if (text === '/start') {
            return bot.sendMessage(
                chatId,
                `Assalomu alaykum!\n` +
                `👮‍♂️ **Nazoratchi:** Islomov Diyorbek\n` +
                `👩‍🏫 **O'qituvchi:** Azizova Zulxumor\n` +
                `👥 **O'quvchilar soni:** ${studentList.length} ta\n\n` +
                `📋 O'quvchilar ro'yxati uchun: /list\n` +
                `📊 Umumiy davomat hisoboti uchun: /status\n\n` +
                `👉 Darsga kelmagan o'quvchining **ID raqamini** yozib yuboring (1 dan 23 gacha).`,
                { parse_mode: 'Markdown' }
            );
        }

        if (text === '/list') {
            let message = `📋 **SINF O'QUVCHILARI RO'YXATI (${studentList.length} TA O'QUVCHI):**\n\n`;
            for (const id in studentsData) {
                message += `**${id}**. ${studentsData[id].name}\n`;
            }
            message += "\n👉 Darsga kelmagan o'quvchining **ID raqamini** yuboring:";
            return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        if (text === '/status') {
            let report = `📊 **DAVOMAT VA JARIMALAR HISOBOTI:**\n*(Nazoratda: Islomov Diyorbek & O'qituvchi Azizova Zulxumor)*\n\n`;
            for (const id in studentsData) {
                const st = studentsData[id];
                report += `👤 **${st.name}**\n❌ Kelmagan: ${st.absences} marta | 🚨 Jarima: ${st.fines} ta\n------------------------------\n`;
            }
            return bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        }

        if (studentsData[text]) {
            const student = studentsData[text];
            student.absences += 1;

            let response = `❌ **${student.name}** darsga kelmadi deb belgilandi!\nJami dars qoldirgan kunlari: **${student.absences} marta**.\n`;

            if (student.absences === 3) {
                response += `\n⚠️ **OGOHLANTIRISH!**\n${student.name} 3 marta darsga kelmadi! Keyingi dars qoldirishda JARIMA qo'llaniladi!`;
            } else if (student.absences > 3) {
                student.fines += 1;
                response += `\n🚨 **JARIMA QO'LLANILDI!**\n${student.name} dars qoldirish me'yoridan oshdi. Unga **${student.fines}-jarima** belgilandi!`;
            }

            return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId, "Iltimos, o'quvchi ID raqamini (1-23) kiriting yoki /list buyrug'idan foydalaning.");
    });
};

bootstrap();
