const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')

dotenv.config()

const token = process.env.botToken
const bot = new TelegramBot(token, { polling: true })

bot.on('message', msg => {
  bot.sendMessage(msg.chat.id, 'I AM A HUMAN BEEP BOOP.')
})
