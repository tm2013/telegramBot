const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const ramda = require('ramda')

dotenv.config()

const token = process.env.botToken
const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/ping/, msg => {
  bot.sendMessage(msg.chat.id, 'pong')
})

bot.onText(/\/repo/, msg => {
  bot.sendMessage(msg.chat.id, 'https://github.com/nishad10/telegramBot')
})

bot.onText(/\/bittrex/, msg => {
  axios
    .get('https://api.bittrex.com/api/v1.1/public/getmarketsummaries')
    .then(res => res.data)
    .then(data => data.result)
    .then(result => {
      const id = ramda.findIndex(ramda.propEq('MarketName', 'BTC-RADS'))(result)
      const date = new Date(result[id].Created)
      bot.sendMessage(
        msg.chat.id,
        `${decodeURI('%60BITTREX%60')}
        \n*High*: ${result[id].High}
        \n*Low*: ${result[id].Low}
        \n*Volume*: ${result[id].Volume}
        \n*Open Buy Orders*: ${result[id].OpenBuyOrders}
        \n*Open Sell Orders*: ${result[id].OpenSellOrders}
        \n*Created*: ${date.toDateString()}`,
        { parse_mode: 'Markdown' }
      )
    })
    .catch(e => bot.sendMessage(msg.chat.id, 'Something went wrong!'))
})
