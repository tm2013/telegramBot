const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const ramda = require('ramda')

dotenv.config()

const token = process.env.botToken
const bot = new TelegramBot(token, { polling: true })

const priceTemplateBittrex = (name, data, btc) =>
  `${decodeURI(`%60${name}%60`)} : ${parseFloat(data.Last).toFixed(
    8
  )} BTC | $${parseFloat(data.Last * btc).toFixed(2)}
*Vol:* ${Math.round(data.Volume)} RADS | 0.0 BTC
*Low:* ${parseFloat(data.Low).toFixed(8)} | *High:* ${parseFloat(
    data.High
  ).toFixed(8)}
*24h change:* ${parseFloat(
    Math.round(
      100 *
        Math.abs((data.Last - data.PrevDay) / ((data.Last + data.PrevDay) / 2))
    )
  ).toFixed(2)}%`

const priceTemplateVCC = (name, data, btc) =>
  `${decodeURI(`%60${name}%60`)} : ${parseFloat(data.last).toFixed(
    8
  )} BTC | $${parseFloat(data.last * btc).toFixed(2)}
*Vol:* ${Math.round(data.baseVolume)} RADS | 0.0 BTC
*Low:* ${parseFloat(data.low24hr).toFixed(8)} | *High:* ${parseFloat(
    data.high24hr
  ).toFixed(8)}
*24h change:* ${parseFloat(data.percentChange).toFixed(2)}%`

const priceTemplateUpbit = (name, data, btc) =>
  `${decodeURI(`%60${name}%60`)} : ${parseFloat(data.trade_price).toFixed(
    8
  )} BTC | $${parseFloat(data.trade_price * btc).toFixed(2)}
*Vol:* ${Math.round(data.trade_volume)} RADS | 0.0 BTC
*Low:* ${parseFloat(data.low_price).toFixed(8)} | *High:* ${parseFloat(
    data.high_price
  ).toFixed(8)}
*24h change:* ${parseFloat(
    Math.round(
      100 *
        Math.abs(
          (data.trade_price - data.prev_closing_price) /
            ((data.trade_price + data.prev_closing_price) / 2)
        )
    )
  ).toFixed(2)}%`

const priceTemplateFinexbox = (name, data) =>
  `${decodeURI(`%60${name}%60`)} : ${parseFloat(data.price).toFixed(
    8
  )} BTC | $0.0
*Vol:* ${Math.round(data.volume)} RADS | 0.0 BTC
*Low:* ${parseFloat(data.low).toFixed(8)} | *High:* ${parseFloat(
    data.high
  ).toFixed(8)}
*24h change:* ${parseFloat(data.percent).toFixed(2)}%`

bot.onText(/\/ping/, msg => {
  bot.sendMessage(msg.chat.id, 'pong')
})

bot.onText(/\/repo/, msg => {
  bot.sendMessage(
    msg.chat.id,
    '[GitHub](https://github.com/nishad10/telegramBot)',
    { parse_mode: 'Markdown' }
  )
})

bot.onText(/\/price/, msg => {
  axios
    .all([
      axios.get(
        'https://api.bittrex.com/api/v1.1/public/getmarketsummary?market=btc-rads'
      ), //bittrex with param
      axios.get(
        'https://api.bittrex.com/api/v1.1/public/getmarketsummary?market=USD-BTC'
      ),
      axios.get(`https://vcc.exchange/api/v2/summary`), // vcc without param
      axios.get('https://api.upbit.com/v1/ticker?markets=BTC-RADS'), //upbit with param
      axios.get('https://api.upbit.com/v1/ticker?markets=USDT-BTC'), //upbit with param
      axios.get('https://xapi.finexbox.com/v1/market') // finebox without param
    ])
    .then(
      axios.spread(
        (bittrex, bittrexBTCData, vcc, upbit, upbitBTCData, finebox) => {
          const bittrexData = bittrex.data.success ? bittrex.data.result[0] : {}
          const bittrexBTC = bittrexBTCData.data.success
            ? bittrexBTCData.data.result[0].Last
            : 0
          const vccData = ramda.isNil(ramda.prop('rads_btc', vcc.data.data))
            ? {}
            : ramda.prop('rads_btc', vcc.data.data)
          const vccBTC = ramda.isNil(ramda.prop('btc_usdt', vcc.data.data))
            ? 0
            : ramda.prop('btc_usdt', vcc.data.data).last
          const upbitData = upbit.data[0]
          const upbitBTC = upbitBTCData.data[0].trade_price
          const fineboxID = ramda.findIndex(ramda.propEq('market', 'RADS_BTC'))(
            finebox.data.result
          )
          const fineboxData = ramda.isNil(finebox.data.result[fineboxID])
            ? {}
            : finebox.data.result[fineboxID]
          bot.sendMessage(
            msg.chat.id,
            `${priceTemplateBittrex('Bittrex', bittrexData, bittrexBTC)}
            \n${priceTemplateVCC('VCC', vccData, vccBTC)}
            \n${priceTemplateUpbit('Upbit', upbitData, upbitBTC)}
            \n${priceTemplateFinexbox('Finexbox', fineboxData)}`,
            { parse_mode: 'Markdown' }
          )
        }
      )
    )
    .catch(error => console.log(error))
})
