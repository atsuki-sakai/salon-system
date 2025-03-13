import { LineMessage, LineMessageOptions } from './types/LineMessage';
import { MessageRepository } from './Repositories/MessageRepository';
import { LineMessageRepository } from './Repositories/LineMessageRepository';

/**
 * LINE関連のサービスクラス
 * アプリケーションのユースケースを実装する
 */
export class LineService {
  private messageRepository: MessageRepository;

  /**
   * コンストラクタ
   * @param messageRepository メッセージリポジトリの実装（DI用）
   */
  constructor(messageRepository?: MessageRepository) {
    // リポジトリの注入がなければデフォルト実装を使用（DIパターン）
    this.messageRepository = messageRepository || new LineMessageRepository();
  }

  /**
   * LINEメッセージを送信する
   * @param lineId 送信先のLINEユーザーID
   * @param message 送信するメッセージ内容
   * @param accessToken LINEチャネルアクセストークン
   * @returns 送信結果の成否と結果メッセージ
   */
  async sendMessage(
    lineId: string,
    message: string,
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // リクエストからドメインエンティティへの変換
      const lineMessage: LineMessage = {
        lineId,
        message,
      };
      
      const options: LineMessageOptions = {
        accessToken,
      };

      // リポジトリを使用してメッセージを送信
      await this.messageRepository.sendMessage(lineMessage, options);

      return {
        success: true,
        message: 'メッセージが送信されました。',
      };
    } catch (error) {
      // エラーハンドリング
      console.error('Error in LineService.sendMessage:', error);
      
      if (error instanceof Error) {
        return {
          success: false,
          message: `メッセージ送信に失敗しました: ${error.message}`,
        };
      } else {
        return {
          success: false,
          message: 'メッセージ送信に失敗しました: 不明なエラー',
        };
      }
    }
  }
}
