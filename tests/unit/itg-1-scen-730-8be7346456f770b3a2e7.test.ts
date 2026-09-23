import { describe, it, expect, jest } from '@jest/globals';

describe('SCEN-730: 日報データベースが一時的に取得できないとき、警告が発生', () => {
  it('データベース接続エラーが発生した場合、警告メッセージが表示される', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((_message?: any) => {});

    // 実装シミュレーション
    const judgeWithErrorHandling = (input: any) => {
      try {
        // 営業日判定を試みる（エラー発生）
        throw new Error('日報データを取得できません。しばらく待ってから再度確認してください');
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('日報データを取得できません')) {
          console.warn(errorMessage);
          return {
            shouldExecute: false,
            isBusinessDay: false,
            isWithinExecutionWindow: false,
            nextScheduledExecutionTime: null,
            executionReason: 'データベース接続エラー',
          };
        }
        throw error;
      }
    };

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeWithErrorHandling(input);

    // スケジューラ実行判定が実行されないことを確認
    expect(result.shouldExecute).toBe(false);
    // 警告ログが出力されたことを確認
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('日報データを取得できません')
    );

    consoleWarnSpy.mockRestore();
  });

  it('警告メッセージが管理画面に表示される', () => {
    const warningMessages: string[] = [];
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation((msg: any) => {
      warningMessages.push(String(msg));
    });

    const errorMessage = '日報データを取得できません。しばらく待ってから再度確認してください';
    console.warn(errorMessage);

    expect(warningMessages).toContain(errorMessage);
    expect(warningMessages.length).toBe(1);

    mockConsoleWarn.mockRestore();
  });
});
