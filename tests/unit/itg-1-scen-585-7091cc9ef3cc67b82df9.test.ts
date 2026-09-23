import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  RetrieveNonSubmissionDetectionDetailsOutput,
} from '../../src/logic/daily-report-management-view';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveReporterByUserId } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-585: リーダーが自身のチームの検知ログIDを指定して詳細を確認すると、検知日時・対象者・リマインダー送信状況・提出状況が詳細表示用に整形されて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知ログ詳細が整形されて返される', async () => {
    const detectionLogId = 'DL-2024-001';
    const leaderId = 'LEADER-001';

    // スタブ準備：retrieveNonSubmissionDetectionLogsByDate
    jest.mocked(retrieveNonSubmissionDetectionLogsByDate).mockResolvedValue([
      {
        detectionLogId: 'DL-2024-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          { userId: 'USER-002', name: '山田太郎', team: '営業部' },
          { userId: 'USER-004', name: '鈴木花子', team: '営業部' },
        ],
      },
    ]);

    // スタブ準備：retrieveReporterByUserId
    jest.mocked(retrieveReporterByUserId).mockResolvedValue({ team: '営業部' });

    // テスト対象処理を実行
    const result = await retrieveNonSubmissionDetectionDetails({
      detectionLogId,
      leaderId,
    });

    // 期待値検証
    expect(result).toBeDefined();
    expect(result.detectionLogId).toBe('DL-2024-001');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionDateTime).toBe('2024-01-15T09:30:00Z');

    // 未提出者情報の検証
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'USER-002',
      name: '山田太郎',
      team: '営業部',
    });

    // リマインダー送信状況の検証
    expect(result.reminderSendingStatus).toBeDefined();
    expect(result.reminderSendingStatus.sentDateTime).toBe('2024-01-15T09:35:00Z');
    expect(result.reminderSendingStatus.targetCount).toBe(2);
    expect(result.reminderSendingStatus.successCount).toBe(2);
    expect(result.reminderSendingStatus.failureCount).toBe(0);
    expect(result.reminderSendingStatus.status).toBe('completed');

    // 提出状況の検証
    expect(result.submissionStatusAfterReminder).toBeDefined();
    expect(result.submissionStatusAfterReminder['USER-002']).toMatchObject({
      submittedAt: '2024-01-15T14:20:00Z',
      status: 'submitted',
    });
    expect(result.submissionStatusAfterReminder['USER-004']).toMatchObject({
      submittedAt: '2024-01-16T08:10:00Z',
      status: 'submitted',
    });
    expect(result.submissionStatusAfterReminder.allSubmitted).toBe(true);
  });
});
