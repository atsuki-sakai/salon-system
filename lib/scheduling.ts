
// lib/scheduling.ts

/**
 * 時間文字列を分に変換する関数
 * 例："09:00" → 540 (分)
 */
export function timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours! * 60 + minutes!;
  }
  
  /**
   * 分を時間文字列に変換する関数
   * 例：540 → "09:00"
   */
  export function minutesToTimeString(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  
  /**
   * 営業時間内の空き時間枠を計算する関数
   * @param openTime 営業開始時間（分単位）
   * @param closeTime 営業終了時間（分単位）
   * @param reservations 既存の予約（{start, end}：分単位のオブジェクトの配列）
   * @param duration 必要な施術時間（分単位）
   * @param interval 提案する時間枠の間隔（分単位、デフォルトは10分）
   * @returns 利用可能な開始時刻（分単位）の配列
   */
  export function computeAvailableTimeSlots(
    openTime: number,
    closeTime: number,
    reservations: { start: number; end: number }[],
    duration: number,
    interval: number = 10
  ): number[] {
    // 営業時間のチェック
    if (openTime >= closeTime) {
      console.error("無効な営業時間: 開始時間が終了時間以降です");
      return [];
    }
    if (duration <= 0 || closeTime - openTime < duration) {
      console.error("施術時間が営業時間内に収まりません");
      return [];
    }
  
    const slots: number[] = [];
  
    // 予約がない場合、営業時間全体から施術可能な時間枠を算出
    if (!reservations || reservations.length === 0) {
      for (let t = openTime; t + duration <= closeTime; t += interval) {
        slots.push(t);
      }
      return slots;
    }
  
    // 予約情報の整合性チェックと昇順ソート
    const validReservations = reservations.filter(r =>
      r.start >= openTime && r.end <= closeTime && r.end > r.start
    );
    const sortedReservations = [...validReservations].sort((a, b) => a.start - b.start);
  
    // (1) 営業開始から最初の予約までの空き
    if (sortedReservations.length > 0 && sortedReservations[0]!.start > openTime) {
      for (let t = openTime; t + duration <= sortedReservations[0]!.start; t += interval) {
        slots.push(t);
      }
    }
  
    // (2) 予約間の空き
    for (let i = 0; i < sortedReservations.length - 1; i++) {
      const currentEnd = sortedReservations[i]!.end;
      const nextStart = sortedReservations[i + 1]!.start;
      if (nextStart - currentEnd >= duration) {
        for (let t = currentEnd; t + duration <= nextStart; t += interval) {
          slots.push(t);
        }
      }
    }
  
    // (3) 最後の予約から閉店までの空き
    const lastReservation = sortedReservations[sortedReservations.length - 1];
    if (lastReservation && lastReservation.end < closeTime) {
      for (let t = lastReservation.end; t + duration <= closeTime; t += interval) {
        slots.push(t);
      }
    }
  
    return slots;
  }
  
  export function createFullDateTime(dateStr: string, timeStr: string): string {
    // dateStrが既にISO形式（YYYY-MM-DD）であることを前提
    const datePart = dateStr.split("T")[0]; // もしdateStrがISO形式の場合、Tより前の部分を取得
  
    // timeStrがHH:MM形式であることを前提
    // ISO形式のタイムスタンプ（YYYY-MM-DDTHH:MM）を生成
    return `${datePart}T${timeStr}`;
  }
  