const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const ramda = require('ramda')
const fs = require('fs')

let bot
const token = process.env.botToken

const httpClient = axios.create()
httpClient.defaults.timeout = 5000

function useNull() {
  return undefined
}

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token, { polling: true })
  //gubot.setWebHook(process.env.HEROKU_URL + token)
} else {
  bot = new TelegramBot(token, { polling: true })
}
const config = {
  headers: {
    ['X-CMC_PRO_API_KEY']: process.env.coinMarketCapKey
  }
}
console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode')

const priceTemplateBittrex = (name, data, btc) =>
  `[BITTREX](https://bittrex.com/Market/Index?MarketName=BTC-RADS) : ${parseFloat(
    data.Last
  ).toFixed(8)} BTC | $${parseFloat(data.Last * btc).toFixed(2)}
*Vol:* ${Math.round(data.Volume)} RADS **|** ${(parseFloat(data.Last).toFixed(
    8
  ) * Math.round(data.Volume)
  ).toFixed(2)} BTC **|** ${Math.round(data.Volume * data.Last * btc)} USD
*Low:* ${parseFloat(data.Low).toFixed(8)} | *High:* ${parseFloat(
    data.High
  ).toFixed(8)}
*24h change:* ${parseFloat(
    Math.round(
      100 *
        Math.abs((data.Last - data.PrevDay) / ((data.Last + data.PrevDay) / 2))
    )
  ).toFixed(2)}% ${parseFloat(
    Math.round(
      100 *
        Math.abs((data.Last - data.PrevDay) / ((data.Last + data.PrevDay) / 2))
    )
  ).toFixed(2) >= 0
    ? ' ⬆️'
    : ' ⬇️'}`

const priceTemplateVCC = (name, data, btc) =>
  `[VCC](https://vcc.exchange/exchange/basic?currency=btc&coin=rads) : ${parseFloat(
    data.last
  ).toFixed(8)} BTC | $${parseFloat(data.last * btc).toFixed(2)}
*Vol:* ${Math.round(data.baseVolume)} RADS **|** ${(parseFloat(
    data.last
  ).toFixed(8) * Math.round(data.baseVolume)
  ).toFixed(2)} BTC **|** ${Math.round(data.baseVolume * data.last * btc)} USD
*Low:* ${parseFloat(data.low24hr).toFixed(8)} | *High:* ${parseFloat(
    data.high24hr
  ).toFixed(8)}
*24h change:* ${parseFloat(data.percentChange).toFixed(2)}% ${parseFloat(
    data.percentChange
  ).toFixed(2) >= 0
    ? ' ⬆️'
    : ' ⬇️'}`

const priceTemplateUpbit = (name, data, btc) =>
  `[UPbit](https://upbit.com/exchange?code=CRIX.UPBIT.BTC-RADS) : ${parseFloat(
    data.trade_price
  ).toFixed(8)} BTC | $${parseFloat(data.trade_price * btc).toFixed(2)}
*Vol:* ${Math.round(data.trade_volume)} RADS **|** ${(parseFloat(
    data.trade_price
  ).toFixed(8) * Math.round(data.trade_volume)
  ).toFixed(2)} BTC **|** ${Math.round(
    data.trade_volume * data.trade_price * btc
  )} USD
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
  ).toFixed(2)}% ${parseFloat(
    Math.round(
      100 *
        Math.abs(
          (data.trade_price - data.prev_closing_price) /
            ((data.trade_price + data.prev_closing_price) / 2)
        )
    )
  ).toFixed(2) >= 0
    ? ' ⬆️'
    : ' ⬇️'}`

const priceTemplateFinexbox = (name, data, btc) =>
  `[FINEXBOX](https://www.finexbox.com/market/pair/RADS-BTC.html) : ${parseFloat(
    data.price
  ).toFixed(8)} BTC | $${parseFloat(data.price * btc).toFixed(2)}
*Vol:* ${Math.round(data.volume)} RADS **|** ${(parseFloat(data.price).toFixed(
    8
  ) * Math.round(data.volume)
  ).toFixed(2)} BTC **|** ${Math.round(data.volume * data.price * btc)} USD
*Low:* ${parseFloat(data.low).toFixed(8)} | *High:* ${parseFloat(
    data.high
  ).toFixed(8)}
*24h change:* N/A`

/*
 ${parseFloat(data.percent).toFixed(2)}% ${parseFloat(
    data.percent
  ).toFixed(8) >= 0
    ? ' ⬆️'
    : ' ⬇️'}
    */
/*const Word_Lists = {
  badwords: [
    'DUMP',
    'HTTP',
    'AIRDROP',
    'PUMP',
    'JOIN',
    'INVITE',
    'BUY',
    'SERCH',
    'MESSAGE',
    'PM'
  ],
  problemwords: [
    'PROFIT',
    'BUY',
    'SELL',
    'BOUNTY',
    'FREE',
    'CHECK',
    'TRADE',
    'LINK',
    'SIGNAL',
    'NOW',
    'GUARANTEED',
    'GROUP',
    'CHANNEL',
    'LINK',
    'GROUP',
    'AIRDROP',
    'LEGIT',
    'INVESMENT',
    'FRAUD',
    'FRAUDSTER',
    'INVEST',
    'POST',
    'CONGRATULATIONS',
    'BENEFIT',
    'DM',
    'MESSAGE',
    'TIMES',
    'TRADING',
    'INBOX',
    'OPPORTUNITY',
    '1X',
    '2X',
    '3X',
    '4X',
    '5X',
    '6X',
    '7X',
    '8X',
    '9X',
    '10X',
    '11X',
    '12X',
    '13X',
    '14X',
    '15X',
    '16X',
    '17X',
    '18X',
    '19X',
    '20X',
    '25X',
    '50X',
    '100X'
  ]
}
bot.on('message', msg => {
  console.log('in')
  //first filter out messages we dont care about
  if (ramda.isNil(msg.text) || ramda.isEmpty(msg.text)) return false
  console.log('inpass')
  const messagetext = msg.text.toUpperCase()
  const seperated = messagetext.split(/[\s,\r\n]+/g)
  //assuming telegram link was included...
  let bad_count = 0
  //console.log(messagetext)

  Word_Lists.badwords.map(x => {
    if (ramda.includes(x, seperated)) {
      bad_count += 1
    } else {
    }
  })
  console.log('inpa2ss')
  console.log(seperated)
  Word_Lists.problemwords.map(x => {
    if (ramda.includes(x, seperated)) {
      bad_count += 1
    } else {
    }
  })
  console.log(bad_count)
  const wordcount = messagetext.split(/[\s,\r\n]+/g).length
  console.log(wordcount)
  const badscore = bad_count / wordcount
  console.log(badscore)
  if (badscore > 0.015) {
    console.log('This should be a ban.')
    return true
  } else {
    console.log('This is fine.')
    return false
  }
})*/
bot.on('message', msg => {
  if (!msg.text.startsWith('/')) {
    const data = 'NEWDATASTART\n' + msg.text + '\nNEWDATAEND\n'
    fs.appendFile('spam.txt', data, err => {
      // In case of a error throw err.
      if (err) console.log(err)
    })
  }
  console.log(
    `\x1b[36m Requested by: \x1b[0m${msg.from.id}, \x1b[36m Alias: \x1b[0m${msg
      .from.username} ${msg.chat.type === 'supergroup'
      ? `\x1b[36m Group: \x1b[0m${msg.chat.title}`
      : `\x1b[36m Private: \x1b[0m${msg.chat.username}`}
      \x1b[36m Msg Txt: \x1b[0m${msg.text},
      \x1b[36m Timestamp: \x1b[0m${new Date(msg.date * 1000).toUTCString()}),`
  )
})
bot.onText(/\/ping/, msg => {
  if (new Date(new Date().toUTCString()) - new Date(msg.date * 1000) < 10000)
    bot.sendMessage(msg.chat.id, 'pong')
})
bot.onText(/\/help/, msg => {
  if (new Date(new Date().toUTCString()) - new Date(msg.date * 1000) < 10000)
    bot.sendMessage(
      msg.chat.id,
      `
/price - To see the RADS price across different exchanges
/mcap  - To see the RADS market capitalization`,
      { parse_mode: 'Markdown' }
    )
})
bot.onText(/\/repo/, msg => {
  if (new Date(new Date().toUTCString()) - new Date(msg.date * 1000) < 10000)
    bot.sendMessage(
      msg.chat.id,
      '[GitHub](https://github.com/nishad10/telegramBot)',
      { parse_mode: 'Markdown' }
    )
})
bot.onText(/\/mcap/, (msg, a) => {
  axios
    .all([
      httpClient.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=RADS',
        config
      ),
      httpClient.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
        config
      )
    ])
    .then(
      axios.spread((mcap, btc) => {
        bot.sendMessage(
          msg.chat.id,
          `$${Math.round(
            mcap.data.data.RADS.quote.USD.market_cap
          ).toLocaleString()} | ${parseFloat(
            mcap.data.data.RADS.quote.USD.market_cap /
              btc.data.data.BTC.quote.USD.price
          ).toFixed(2)} BTC`,
          { parse_mode: 'Markdown' }
        )
      })
    )
    .catch(error => console.log(error))
})

let vccBTC = 0
let vccData = 0
let bittrexData = 0
let bittrexBTC = 0
let upbitBTC = 0
let upbitData = 0
let fineboxData = 0
let coinMarketCapBTC = 0
bot.onText(/\/price/, msg => {
  const save = msg
  if (new Date(new Date().toUTCString()) - new Date(msg.date * 1000) < 10000)
    axios
      .all([
        httpClient
          .get(
            'https://api.bittrex.com/api/v1.1/public/getmarketsummary?market=btc-rads'
          )
          .catch(useNull), //bittrex with param
        httpClient
          .get(
            'https://api.bittrex.com/api/v1.1/public/getmarketsummary?market=USD-BTC'
          )
          .catch(useNull),
        httpClient.get(`https://vcc.exchange/api/v2/summary`).catch(useNull), // vcc without param
        httpClient
          .get('https://api.upbit.com/v1/ticker?markets=BTC-RADS')
          .catch(useNull), //upbit with param
        httpClient
          .get('https://api.upbit.com/v1/ticker?markets=USDT-BTC')
          .catch(useNull), //upbit with param
        httpClient.get('https://xapi.finexbox.com/v1/market').catch(useNull), // finebox without param
        httpClient
          .get(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
            config
          )
          .catch(useNull) // This is the BTC USD Price for converting finexbox RADS/BTC price to USD. !!! Will have small discrepancy as not getting the BTC/USD price from finexbox directly'
      ])
      .then(
        axios.spread(
          (
            bittrex,
            bittrexBTCData,
            vcc,
            upbit,
            upbitBTCData,
            finebox,
            coinMarketCapBTCData
          ) => {
            if (!ramda.isNil(bittrex) && !ramda.isNil(bittrexBTCData)) {
              bittrexData = bittrex.data.success ? bittrex.data.result[0] : {}
              bittrexBTC = bittrexBTCData.data.success
                ? bittrexBTCData.data.result[0].Last
                : 0
            }
            if (!ramda.isNil(vcc)) {
              vccData = ramda.isNil(ramda.prop('rads_btc', vcc.data.data))
                ? {}
                : ramda.prop('rads_btc', vcc.data.data)
              vccBTC = ramda.isNil(ramda.prop('btc_usdt', vcc.data.data))
                ? 0
                : ramda.prop('btc_usdt', vcc.data.data).last
            }
            if (!ramda.isNil(upbit) && !ramda.isNil(upbitBTCData)) {
              upbitData = upbit.data[0]
              upbitBTC = upbitBTCData.data[0].trade_price
            }
            /*if (!ramda.isNil(finebox) && !ramda.isNil(coinMarketCapBTCData)) {
              fineboxID = ramda.findIndex(ramda.propEq('market', 'RADS_BTC'))(
                finebox.data.result
              )
              fineboxData = ramda.isNil(finebox.data.result[fineboxID])
                ? {}
                : finebox.data.result[fineboxID]
              coinMarketCapBTC =
                coinMarketCapBTCData.data.data.BTC.quote.USD.price
            }*/ // Not listed on finebox.
            bot.sendMessage(
              msg.chat.id,
              `${!ramda.isNil(bittrex)
                ? priceTemplateBittrex('Bittrex', bittrexData, bittrexBTC)
                : '[BITTREX](https://bittrex.com/Market/Index?MarketName=BTC-RADS) servers are down.'}
            \n${!ramda.isNil(vcc)
              ? priceTemplateVCC('VCC', vccData, vccBTC)
              : '[VCC](https://vcc.exchange/exchange/basic?currency=btc&coin=rads) servers are down.'}
            \n${!ramda.isNil(upbit)
              ? priceTemplateUpbit('Upbit', upbitData, upbitBTC)
              : '[UPbit](https://upbit.com/exchange?code=CRIX.UPBIT.BTC-RADS) Servers are down.'}`,
              { parse_mode: 'Markdown', disable_web_page_preview: true }
            )
            /*
            \n${!ramda.isNil(finebox)
              ? priceTemplateFinexbox('Finexbox', fineboxData, coinMarketCapBTC)
              : '[FINEXBOX](https://www.finexbox.com/market/pair/RADS-BTC.html) Servers are down!'}
              */
          }
        )
      )
      .catch(error => {
        console.log(error)
        bot.sendMessage(
          save.chat.id,
          `Looks like something went wrong, try again after some time, this should not happen.`,
          { parse_mode: 'Markdown', disable_web_page_preview: true }
        )
      })
})

module.exports = bot
