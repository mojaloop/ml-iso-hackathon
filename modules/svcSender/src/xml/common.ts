export interface Participant {
  name: string,
  bic: string
}

export interface Party {
  msisdn: string
}

export interface MessageHeader {
  messageId: string, 
  creationDateTime: Date
}

export interface MessageHeaderWithInitiatingParty extends MessageHeader {
  initiatingParty: Participant

}
