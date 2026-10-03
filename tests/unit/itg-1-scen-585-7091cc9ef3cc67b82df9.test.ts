import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveNonSubmissionDetectionDetails,
  RetrieveNonSubmissionDetectionDetailsInput,
  RetrieveNonSubmissionDetectionDetailsOutput,
} from '../../src/logic/daily-report-management-view';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as userMasterModule from '../../src/logic/user-master-persistence';


describe('SCEN-585: リーダーが自身のチームの検知ログIDを指定して詳細を確認すると、検知日時・対象者・リマインダー送信状況・提出状況が詳細表示用に整形されて返される', () => {
  const detectionLogId = 'DL-2024-001';
  const leaderId = 'LEADER-001';
  const targetDate = '2024-01-15';

  beforeEach(() => {
    jest.clearAllMocks();

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId,
        targetDate,
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          { userId: 'USER-002', userName: '山田太郎', department: '営業部' },
          { userId: 'USER-004', userName: '鈴木花子', department: '営業部' },
        ],
        reminderSentDateTime: '2024-01-15T09:35:00Z',
        reminderSendingMethod: 'email',
      },
    ]);

    (userMasterModule.retrieveReporterByUserId as jest.Mock<any>).mockResolvedValue({
      userId: leaderId,
      userName: 'リーダー太郎',
      department: '営業部',
    });
  });

  it('検知ログの詳細が正常に返される', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId,
      leaderId,
    };

    const result: RetrieveNonSubmissionDetectionDetailsOutput = await retrieveNonSubmissionDetectionDetails(input);

    expect(result.detectionLogId).toBe(detectionLogId);
    expect(result.targetDate).toBe(targetDate);
    expect(result.detectionDateTime).toBe('2024-01-15T09:30:00Z');
    expect(result.nonSubmittedReporters).toHaveLength(2);
  });

  it('未提出者情報が正確に返される', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId,
      leaderId,
    };

    const result: RetrieveNonSubmissionDetectionDetailsOutput = await retrieveNonSubmissionDetectionDetails(input);

    expect(result.nonSubmittedReporters[0].reporterId).toBe('USER-002');
    expect(result.nonSubmittedReporters[0].reporterName).toBe('山田太郎');
    expect(result.nonSubmittedReporters[0].department).toBe('営業部');
    expect(result.nonSubmittedReporters[1].reporterId).toBe('USER-004');
    expect(result.nonSubmittedReporters[1].reporterName).toBe('鈴木花子');
    expect(result.nonSubmittedReporters[1].department).toBe('営業部');
  });

  it('リマインダー送信状況が返される', async () => {
    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId,
      leaderId,
    };

    const result: RetrieveNonSubmissionDetectionDetailsOutput = await retrieveNonSubmissionDetectionDetails(input);

    expect(result.reminderSendingStatus).toBeDefined();
    expect(result.reminderSendingStatus.reminderSentDateTime).toBe('2024-01-15T09:35:00Z');
  });
});
