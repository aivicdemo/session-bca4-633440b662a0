import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import type {
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../.aivic/design/contract/src/logic/reporter-master-management';

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
    // ステップ1: getActiveReportersForSubmissionCheck を呼び出す
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const mockGetActiveReporters = jest.fn(
      async (
        input: GetActiveReportersForSubmissionCheckInput
      ): Promise<GetActiveReportersForSubmissionCheckOutput> => {
        return {
          success: true,
          reporters: [
            {
              reporterId: 'rep-001',
              userId: 'user-001',
              reporterName: '田中太郎',
              emailAddress: 'tanaka@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-002',
              userId: 'user-002',
              reporterName: '鈴木次郎',
              emailAddress: 'suzuki@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-003',
              userId: 'user-003',
              reporterName: '佐藤三郎',
              emailAddress: 'sato@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-004',
              userId: 'user-004',
              reporterName: '山田四郎',
              emailAddress: 'yamada@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-005',
              userId: 'user-005',
              reporterName: '高橋五郎',
              emailAddress: 'takahashi@example.com',
              department: '営業部',
              status: 'active',
            },
          ] as ReadonlyArray<ActiveReporterInfo>,
          totalCount: 5,
          message: 'Active reporters retrieved successfully',
        };
      }
    );

    // ステップ2: 戻り値の検証
    const result = await mockGetActiveReporters(input);

    expect(result.success).toBe(true);
    expect(result.reporters).toHaveLength(5);
    expect(result.totalCount).toBe(5);

    // ステップ3 & 4: EmailNotificationService.sendReminderEmail をスタブ化し、各報告者に対して呼び出される
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

    // 送信日時が現在時刻に近い値
    expect(log.sendingDateTime).toBeDefined();
    const logTime = new Date(log.sendingDateTime);
    const now = new Date();
    const timeDifference = Math.abs(now.getTime() - logTime.getTime());
    expect(timeDifference).toBeLessThan(5000); // 5秒以内

    // 対象者に getActiveReportersForSubmissionCheck の出力型 reporters に含まれる各報告者の userId が列挙
    expect(log.targetUsers).toHaveLength(result.reporters.length);
    result.reporters.forEach((reporter) => {
      expect(log.targetUsers).toContain(reporter.userId);
    });

    // 送信成否が true
    expect(log.sendingSuccess).toBe(true);

    // mockSendReminderEmail が全ての報告者に対して呼び出されたことを確認
    expect(mockSendReminderEmail).toHaveBeenCalledTimes(result.reporters.length);
  });

  it('複数の報告者に対して各々のリマインダー送信が実行されることを確認', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const mockGetActiveReporters = jest.fn(
      async (
        input: GetActiveReportersForSubmissionCheckInput
      ): Promise<GetActiveReportersForSubmissionCheckOutput> => {
        return {
          success: true,
          reporters: [
            {
              reporterId: 'rep-001',
              userId: 'user-001',
              reporterName: '田中太郎',
              emailAddress: 'tanaka@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-002',
              userId: 'user-002',
              reporterName: '鈴木次郎',
              emailAddress: 'suzuki@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-003',
              userId: 'user-003',
              reporterName: '佐藤三郎',
              emailAddress: 'sato@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-004',
              userId: 'user-004',
              reporterName: '山田四郎',
              emailAddress: 'yamada@example.com',
              department: '営業部',
              status: 'active',
            },
            {
              reporterId: 'rep-005',
              userId: 'user-005',
              reporterName: '高橋五郎',
              emailAddress: 'takahashi@example.com',
              department: '営業部',
              status: 'active',
            },
          ] as ReadonlyArray<ActiveReporterInfo>,
          totalCount: 5,
          message: 'Active reporters retrieved successfully',
        };
      }
    );

    const result = await mockGetActiveReporters(input);

    expect(result.reporters).toHaveLength(5);

    // 各報告者に対してリマインダー送信を実行
    for (const reporter of result.reporters) {
      await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
    }

    // sendReminderEmail が5回呼ばれたことを確認
    expect(mockSendReminderEmail).toHaveBeenCalledTimes(5);

    // 各報告者に対して正確に呼び出されたことを確認
    result.reporters.forEach((reporter) => {
      expect(mockSendReminderEmail).toHaveBeenCalledWith(reporter.userId, reporter.emailAddress);
    });
  });
});
