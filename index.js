const TelegramBot = require('node-telegram-bot-api')

const token = 'yourtokengoeshere'
const bot = new TelegramBot(token, { polling: true })

bot.on('message', msg => {
  bot.sendMessage(msg.chat.id, 'I AM A HUMAN BEEP BOOP.')
})
