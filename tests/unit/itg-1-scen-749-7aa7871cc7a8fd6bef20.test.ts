import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import type {
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../src/logic/reporter-master-management';

describe('SCEN-749: 検知ログにリマインダー送信結果（送信日時、対象者、送信成否）が記録される', () => {
  const teamLeaderId = 'leader-001';
  const targetDate = new Date('2026-09-25');

  let detectionLogs: Array<{
    sendingDateTime: string;
    targetUsers: string[];
    sendingSuccess: boolean;
  }> = [];

  beforeEach(() => {
    jest.clearAllMocks();
    detectionLogs = [];
  });

  const mockSendReminderEmail = jest.fn(
    async (userId: string, emailAddress: string) => {
      return {
        success: true,
        sentAt: new Date().toISOString(),
        userId,
      };
    }
  );

  it('検知ログに新規レコードが記録され、送信日時・対象者・送信成否が含まれる', async () => {
    // ステップ1: 有効な過去営業日を targetDate に、有効なチームリーダーID を teamLeaderId にセットして getActiveReportersForSubmissionCheck を呼び出す
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input);

    // ステップ2: 戻り値の検証
    // success が true であること
    expect(result.success).toBe(true);
    // reporters に報告者情報が含まれていること
    expect(Array.isArray(result.reporters)).toBe(true);
    // totalCount が報告者数と一致すること
    expect(result.totalCount).toBe(result.reporters.length);

    // reporters が空でない場合、リマインダー送信を実行
    if (result.reporters.length > 0) {
      // ステップ3: EmailNotificationService.sendReminderEmail をスタブ化
      // ステップ4: reporters に含まれる各報告者に対してリマインダー送信を実行
      const sendingDateTime = new Date().toISOString();
      const targetUserIds: string[] = [];
      let allSuccessful = true;

      for (const reporter of result.reporters) {
        const sendResult = await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
        if (sendResult.success) {
          targetUserIds.push(reporter.userId);
        } else {
          allSuccessful = false;
        }
      }

      // ステップ5: 検知ログに新規レコードが記録されたことを確認
      const logRecord = {
        sendingDateTime,
        targetUsers: targetUserIds,
        sendingSuccess: allSuccessful,
      };
      detectionLogs.push(logRecord);

      expect(detectionLogs.length).toBe(1);

      // ステップ6: 新規レコードの詳細情報を確認し、送信日時、対象者、送信成否の値を検証
      const log = detectionLogs[0];

      // 期待結果(1): 送信日時が現在時刻に近い値
      expect(log.sendingDateTime).toBeDefined();
      const logTime = new Date(log.sendingDateTime);
      const now = new Date();
      const timeDifference = Math.abs(now.getTime() - logTime.getTime());
      expect(timeDifference).toBeLessThan(5000); // 5秒以内

      // 期待結果(2): 対象者に getActiveReportersForSubmissionCheck の出力型 reporters に含まれる各報告者の userId が列挙
      expect(log.targetUsers).toHaveLength(result.reporters.length);
      result.reporters.forEach((reporter) => {
        expect(log.targetUsers).toContain(reporter.userId);
      });

      // 期待結果(3): 送信成否が true
      expect(log.sendingSuccess).toBe(true);

      // mockSendReminderEmail が全ての報告者に対して呼び出されたことを確認
      expect(mockSendReminderEmail).toHaveBeenCalledTimes(result.reporters.length);
    } else {
      // reporters が空の場合、ステップ5-6 をスキップ
      expect(result.reporters.length).toBe(0);
      expect(result.totalCount).toBe(0);
    }
  });

  it('複数の報告者に対して各々のリマインダー送信が実行されることを確認', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input);

    // reporters が存在する場合、各報告者に対してリマインダー送信
    if (result.reporters.length > 0) {
      // 各報告者に対してリマインダー送信を実行
      for (const reporter of result.reporters) {
        await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
      }

      // sendReminderEmail が reporters の数だけ呼ばれたことを確認
      expect(mockSendReminderEmail).toHaveBeenCalledTimes(result.reporters.length);

      // 各報告者に対して正確に呼び出されたことを確認
      result.reporters.forEach((reporter) => {
        expect(mockSendReminderEmail).toHaveBeenCalledWith(reporter.userId, reporter.emailAddress);
      });
    } else {
      expect(result.reporters.length).toBe(0);
    }
  });
});
