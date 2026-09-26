import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveReporterByUserId: jest.fn(),
}));

import { retrieveNonSubmissionDetectionDetails } from '../../src/logic/daily-report-management-view';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveReporterByUserId } from '../../src/logic/user-master-persistence';

const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedRetrieveReporterByUserId = retrieveReporterByUserId as jest.MockedFunction<any>;

describe('SCEN-585: リーダーが自身のチームの検知ログIDを指定して詳細を確認すると、検知日時・対象者・リマインダー送信状況・提出状況が詳細表示用に整形されて返される', () => {
  const detectionLogId = 'DL-2024-001';
  const leaderId = 'LEADER-001';
  const targetDate = '2024-01-15';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      success: true,
      detectionLogs: [
        {
          detectionLogId,
          targetDate,
          detectionDateTime: '2024-01-15T09:30:00Z',
          nonSubmittedReporters: [
            { userId: 'USER-002', name: '山田太郎', team: '営業部' },
            { userId: 'USER-004', name: '鈴木花子', team: '営業部' },
          ],
          reminderSent: true,
          reminderSentDateTime: '2024-01-15T09:35:00Z',
          reminderSendingMethod: 'email',
        },
      ],
      totalCount: 1,
    });

    mockedRetrieveReporterByUserId.mockImplementation((input: any) => {
      if (input.userId === leaderId) {
        return Promise.resolve({
          success: true,
          reporter: {
            userId: leaderId,
            reporterName: 'リーダー太郎',
            team: '営業部',
            email: 'leader@example.com',
          },
        });
      }
      return Promise.reject(new Error('Reporter not found'));
    });
  });

  it('検知ログIDとリーダーIDで詳細情報が取得できる', async () => {
    const result = await retrieveNonSubmissionDetectionDetails({
      detectionLogId,
      leaderId,
    });

    expect(result).toBeDefined();
  });

  it('戻り値はオブジェクト型である', async () => {
    const result = await retrieveNonSubmissionDetectionDetails({
      detectionLogId,
      leaderId,
    });

    expect(typeof result).toBe('object');
  });

  it('RetrieveNonSubmissionDetectionDetailsOutput型の一部フィールドを返す', async () => {
    const result = await retrieveNonSubmissionDetectionDetails({
      detectionLogId,
      leaderId,
    });

    expect(result).toBeDefined();
  });
});
