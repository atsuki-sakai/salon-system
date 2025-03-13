import { LineMessage, LineMessageOptions } from '../types/LineMessage';

/**
 * LINEメッセージリポジトリのインターフェース
 * 外部のLINE APIとのやり取りを抽象化する
 */
export interface MessageRepository {
  /**
   * LINEメッセージを送信する
   * @param message 送信するメッセージエンティティ
   * @param options メッセージ送信時のオプション
   * @returns 送信結果
   */
  sendMessage(message: LineMessage, options: LineMessageOptions): Promise<boolean>;
}
