import IORedis, { Redis } from 'ioredis'

export type Quote = {
  transactionId: string
  quoteId: string
  payeeMsisdn: string
  payeeFspId: string
  payerMsisdn: string
  payerFspId: string
  amount: string
  currency: string
  condition: string
  ilpPacket: string
}

export interface RedisService {
  getQuote: (quoteId: string) => Promise<Quote | null>
  setQuote: (quote: Quote) => Promise<void>
  associatePayeeMsisdnToQuote: (payerMsisdn: string, quoteId: string) => Promise<void>
  getQuoteForMsisdn: (payerMsisdn: string) => Promise<Quote | null>
  mapConditionToQuoteId: (condition: string, quoteId: string) => Promise<void>
  getQuoteFromCondition: (condition: string) => Promise<Quote | null>
  mapTransferToQuote: (transferId: string, quoteId: string) => Promise<void>
  getQuoteForTransfer: (transferId: string) => Promise<Quote | null>
}

export const createRedisService = (redisUrl?: string): RedisService => {
  const client: Redis = new IORedis(redisUrl)

  const getQuote = async (quoteId: string): Promise<Quote | null> => {
    const data = await client.hgetall(`mojabank_quotes:${quoteId}`)

    if (!data) {
      return null
    }

    return data as Quote
  }

  const setQuote = async (quote: Quote): Promise<void> => {
    await client.hset(`mojabank_quotes:${quote.quoteId}`, quote)
  }

  const associatePayeeMsisdnToQuote = async (payeeMsisdn: string, quoteId: string): Promise<void> => {
    await client.sadd(`mojabank_msisdn:${payeeMsisdn}`, quoteId)
  }

  const getQuoteForMsisdn = async (payeeMsisdn: string): Promise<Quote | null> => {
    const quoteId = await client.spop(`mojabank_msisdn:${payeeMsisdn}`)
    if (!quoteId) {
      return null
    }

    return getQuote(quoteId)
  }

  const mapConditionToQuoteId = async (condition: string, quoteId: string): Promise<void> => {
    await client.set(`mojabank_condToQuote:${condition}`, quoteId)
  }

  const getQuoteFromCondition = async (condition: string): Promise<Quote | null> => {
    const quoteId = await client.get(`mojabank_condToQuote:${condition}`)
    if (!quoteId) {
      return null
    }

    return getQuote(quoteId)
  }

  const mapTransferToQuote = async (transferId: string, quoteId: string): Promise<void> => {
    await client.sadd(`mojabank_transfer:${transferId}`, quoteId)
  }

  const getQuoteForTransfer = async (transferId: string): Promise<Quote | null> => {
    const quoteId = await client.spop(`mojabank_transfer:${transferId}`)
    if (!quoteId) {
      return null
    }

    return getQuote(quoteId)
  }

  return {
    getQuote,
    setQuote,
    associatePayeeMsisdnToQuote,
    getQuoteForMsisdn,
    mapConditionToQuoteId,
    getQuoteFromCondition,
    mapTransferToQuote,
    getQuoteForTransfer
  }
}