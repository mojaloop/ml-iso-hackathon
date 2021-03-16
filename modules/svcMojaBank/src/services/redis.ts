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
}

export const createRedisService = (redisUrl?: string): RedisService => {
  const client: Redis = new IORedis(redisUrl)

  const getQuote = async (quoteId: string): Promise<Quote | null> => {
    const data = await client.hgetall(`quotes:${quoteId}`)

    if (!data) {
      return null
    }

    return data as Quote
  }

  const setQuote = async (quote: Quote): Promise<void> => {
    await client.hset(`quotes:${quote.quoteId}`, quote)
  }

  const associatePayeeMsisdnToQuote = async (payerMsisdn: string, quoteId: string): Promise<void> => {
    await client.sadd(payerMsisdn, quoteId)
  }

  const getQuoteForMsisdn = async (payerMsisdn: string): Promise<Quote | null> => {
    const quoteId = await client.spop(payerMsisdn)
    if (!quoteId) {
      return null
    }

    return getQuote(quoteId)
  }

  return {
    getQuote,
    setQuote,
    associatePayeeMsisdnToQuote,
    getQuoteForMsisdn
  }
}