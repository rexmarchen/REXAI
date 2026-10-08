export interface OutboundEmail {
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  // RFC5322 Message-ID we generate ourselves so we can match replies/bounces
  // back to this send without depending on the provider echoing it exactly.
  messageId: string;
  unsubscribeUrl: string;
}

export interface SendResult {
  providerMessageId: string; // Gmail "id" or Graph message id
  rfcMessageId: string;
}
