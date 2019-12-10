const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const ramda = require('ramda')
const fs = require('fs')

let bot
const token = process.env.botToken

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
      axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=RADS',
        config
      ),
      axios.get(
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

bot.onText(/\/price/, msg => {
  const save = msg
  if (new Date(new Date().toUTCString()) - new Date(msg.date * 1000) < 10000)
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
        axios.get('https://xapi.finexbox.com/v1/market'), // finebox without param
        axios.get(
          'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
          config
        ) // This is the BTC USD Price for converting finexbox RADS/BTC price to USD. !!! Will have small discrepancy as not getting the BTC/USD price from finexbox directly'
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
            const bittrexData = bittrex.data.success
              ? bittrex.data.result[0]
              : {}
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
            const fineboxID = ramda.findIndex(
              ramda.propEq('market', 'RADS_BTC')
            )(finebox.data.result)
            const fineboxData = ramda.isNil(finebox.data.result[fineboxID])
              ? {}
              : finebox.data.result[fineboxID]
            const coinMarketCapBTC =
              coinMarketCapBTCData.data.data.BTC.quote.USD.price
            bot.sendMessage(
              msg.chat.id,
              `${priceTemplateBittrex('Bittrex', bittrexData, bittrexBTC)}
            \n${priceTemplateVCC('VCC', vccData, vccBTC)}
            \n${priceTemplateUpbit('Upbit', upbitData, upbitBTC)}
            \n${priceTemplateFinexbox(
              'Finexbox',
              fineboxData,
              coinMarketCapBTC
            )}`,
              { parse_mode: 'Markdown', disable_web_page_preview: true }
            )
          }
        )
      )
      .catch(error => {
        console.log(error)
        bot.sendMessage(
          save.chat.id,
          `Looks like the server we get data from is down, try again after some time.`,
          { parse_mode: 'Markdown', disable_web_page_preview: true }
        )
      })
})

module.exports = bot
