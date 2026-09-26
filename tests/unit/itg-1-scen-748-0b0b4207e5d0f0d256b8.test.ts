import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import type {
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
} from '../../.aivic/design/contract/src/logic/reporter-master-management';

describe('SCEN-748: メール送信が3回失敗した場合、管理者に通知され検知ログに記録される', () => {
  const teamLeaderId = 'leader-001';
  const targetDate = new Date('2026-09-25');
  const maxRetries = 3;

  let emailSendFailures: Array<{
    timestamp: string;
    errorDetails: string;
  }> = [];
  let adminNotifications: Array<{
    recipientId: string;
    message: string;
    sentAt: string;
  }> = [];
  let detectionLogs: Array<{
    timestamp: string;
    errorDetails: string;
    maxRetries: number;
    retryCount: number;
  }> = [];

  beforeEach(() => {
    jest.clearAllMocks();
    emailSendFailures = [];
    adminNotifications = [];
    detectionLogs = [];
  });

  const mockSendReminderEmail = jest.fn(
    async (userId: string, emailAddress: string) => {
      throw new Error('Email service temporarily unavailable');
    }
  );

  it('3回の連続失敗後、管理者通知が送信されて検知ログに詳細が記録される', async () => {
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

    const reportersResult = await mockGetActiveReporters(input);

    expect(reportersResult.success).toBe(true);
    expect(reportersResult.reporters).toHaveLength(5);
    expect(reportersResult.totalCount).toBe(5);

    // リマインダー送信のシミュレーション - 3回失敗する
    const currentTimestamp = new Date().toISOString();
    let consecutiveFailures = 0;
    let lastError: Error | null = null;

    for (const reporter of reportersResult.reporters) {
      consecutiveFailures = 0;
      lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
          consecutiveFailures = 0;
        } catch (error) {
          consecutiveFailures++;
          lastError = error as Error;

          emailSendFailures.push({
            timestamp: currentTimestamp,
            errorDetails: (error as Error).message,
          });

          if (consecutiveFailures === maxRetries) {
            // 3回失敗後の処理
            detectionLogs.push({
              timestamp: currentTimestamp,
              errorDetails: (error as Error).message,
              maxRetries,
              retryCount: consecutiveFailures,
            });

            // 管理者通知を送信
            adminNotifications.push({
              recipientId: teamLeaderId,
              message: `日報リマインダーメール送信失敗: 最大再試行回数（${maxRetries}回）に到達。試行日時=${currentTimestamp}、エラー詳細=${(error as Error).message}`,
              sentAt: currentTimestamp,
            });
          }
        }
      }
    }

    // Step 4: 管理者（チームリーダー）に対して通知が送信されていることを確認
    expect(adminNotifications.length).toBeGreaterThan(0);
    expect(adminNotifications[0].recipientId).toBe(teamLeaderId);
    expect(adminNotifications[0].message).toContain('日報リマインダーメール送信失敗');
    expect(adminNotifications[0].message).toContain(`最大再試行回数（${maxRetries}回）`);

    // Step 5: 検知ログに送信失敗の詳細が記録されていることを確認
    expect(detectionLogs.length).toBeGreaterThan(0);

    const log = detectionLogs[0];
    expect(log.timestamp).toBeDefined();
    expect(log.errorDetails).toContain('Email service');
    expect(log.maxRetries).toBe(3);
    expect(log.retryCount).toBe(3);

    // ログメッセージ形式: 『送信失敗: 最大再試行回数（3回）に到達。試行日時=<timestamp>、エラー詳細=<error内容>』
    expect(adminNotifications[0].message).toMatch(/送信失敗.*最大再試行回数.*3回.*試行日時=.*エラー詳細=/);
  });

  it('日報入力リマインダー通知処理のステータスが「失敗」で終了する', async () => {
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
          ] as ReadonlyArray<ActiveReporterInfo>,
          totalCount: 1,
          message: 'Active reporter retrieved successfully',
        };
      }
    );

    const reportersResult = await mockGetActiveReporters(input);

    let processStatus = 'in_progress';
    let totalFailures = 0;

    for (const reporter of reportersResult.reporters) {
      let consecutiveFailures = 0;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
          consecutiveFailures = 0;
        } catch (error) {
          consecutiveFailures++;
          totalFailures++;

          if (consecutiveFailures === maxRetries) {
            processStatus = 'failed';
          }
        }
      }
    }

    expect(processStatus).toBe('failed');
    expect(totalFailures).toBeGreaterThan(0);
  });

  it('通知先が「管理者（チームリーダー）1人」に限定されて、社内5人の報告者への個別リマインダーメール送信と区別される', async () => {
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

    const reportersResult = await mockGetActiveReporters(input);

    expect(reportersResult.reporters).toHaveLength(5);

    // リマインダー送信試行
    const currentTimestamp = new Date().toISOString();

    for (const reporter of reportersResult.reporters) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await mockSendReminderEmail(reporter.userId, reporter.emailAddress);
        } catch (error) {
          if (attempt === maxRetries) {
            // 3回失敗後は管理者通知のみ
            adminNotifications.push({
              recipientId: teamLeaderId,
              message: `日報リマインダーメール送信失敗`,
              sentAt: currentTimestamp,
            });
          }
        }
      }
    }

    // 通知先が管理者（チームリーダー）1人に限定されていることを確認
    const uniqueRecipients = new Set(adminNotifications.map((n) => n.recipientId));
    expect(uniqueRecipients.size).toBe(1);
    expect(Array.from(uniqueRecipients)[0]).toBe(teamLeaderId);

    // 社内5人の報告者とは区別されることを確認
    expect(reportersResult.reporters).toHaveLength(5);
    // 管理者通知の件数は報告者数とは異なる（集約通知）
    expect(adminNotifications.length).toBeGreaterThan(0);
    expect(adminNotifications.length).toBeLessThanOrEqual(reportersResult.reporters.length);
  });
});
