import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  RetrieveNonSubmissionDetectionDetailsOutput,
} from '../../src/logic/daily-report-management-view';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-585: リーダーが自身のチームの検知ログIDを指定して詳細を確認すると、検知日時・対象者・リマインダー送信状況・提出状況が詳細表示用に整形されて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知ログの詳細情報が整形されて返される', async () => {
    const detectionLogId = 'DL-2024-001';
    const leaderId = 'LEADER-001';

    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([
      {
        detectionLogId,
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          {
            userId: 'USER-002',
            userName: '山田太郎',
            emailAddress: 'yamada@example.com',
          },
          {
            userId: 'USER-004',
            userName: '鈴木花子',
            emailAddress: 'suzuki@example.com',
          },
        ],
      },
    ]);

    const result: RetrieveNonSubmissionDetectionDetailsOutput = await retrieveNonSubmissionDetectionDetails({
      detectionLogId,
      leaderId,
    });

    expect(result.detectionLogId).toBe(detectionLogId);
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.detectionDateTime).toBe('2024-01-15T09:30:00Z');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'USER-002',
      userName: '山田太郎',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'USER-004',
      userName: '鈴木花子',
    });
    expect(result.reminderSendingStatus).toBeDefined();
    expect(result.submissionStatusAfterReminder).toBeDefined();
  });
});
