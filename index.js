const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')

dotenv.config()

const token = process.env.botToken
const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/ping/, msg => {
  bot.sendMessage(msg.chat.id, 'pong')
})

bot.onText(/\//, msg => {
  bot.sendMessage(msg.chat.id, 'https://github.com/nishad10/telegramBot')
})
