import crypto from 'crypto'
import { LineMessage, LineProfile } from './types'

export class LineService {
    private readonly replyUrl: string
    private readonly accessToken: string
    private readonly channelSecret: string

    constructor() {
        const replyUrl = process.env.LINE_REPLY_URL
        const accessToken = process.env.LINE_ACCESS_TOKEN
        const channelSecret = process.env.LINE_CHANNEL_SECRET

        if (!replyUrl || !accessToken || !channelSecret) {
            throw new Error('Required LINE environment variables are not set')
        }

        this.replyUrl = replyUrl
        this.accessToken = accessToken
        this.channelSecret = channelSecret
    }

    async replyMessage(replyToken: string, messages: LineMessage[]): Promise<Response> {
        const response = await fetch(this.replyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
                replyToken,
                messages
            })
        })

        if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(`LINE API error: ${JSON.stringify(errorResponse)}`)
        }

        return response
    }

    async getProfile(lineId: string): Promise<LineProfile> {
        const response = await fetch(`https://api.line.me/v2/bot/profile/${lineId}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        })

        if (!response.ok) {
            throw new Error(`LINE API error: ${response.statusText}`)
        }

        return response.json()
    }

    verifySignature(body: string, signature: string | null): boolean {
        if (!signature) return false

        const hmac = crypto
            .createHmac('SHA256', this.channelSecret)
            .update(body)
            .digest('base64')
        
        return hmac === signature
    }
}