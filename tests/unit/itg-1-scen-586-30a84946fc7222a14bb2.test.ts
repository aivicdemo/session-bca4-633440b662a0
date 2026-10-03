import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveNonSubmissionDetectionDetails,
  RetrieveNonSubmissionDetectionDetailsInput,
  DetectionLogNotFound,
} from '../../src/logic/daily-report-management-view';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-586: 存在しない検知ログIDを指定すると、DetectionLogNotFound エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない検知ログIDを指定するとDetectionLogNotFoundエラーが発生する', async () => {
    const detectionLogId = 'nonexistent-log-id-999';
    const leaderId = 'leader-001';

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);

    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId,
      leaderId,
    };

    await expect(retrieveNonSubmissionDetectionDetails(input)).rejects.toThrow(DetectionLogNotFound);
  });

  it('エラーメッセージが「検知ログが見つかりません。」である', async () => {
    const detectionLogId = 'nonexistent-log-id-999';
    const leaderId = 'leader-001';

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);

    const input: RetrieveNonSubmissionDetectionDetailsInput = {
      detectionLogId,
      leaderId,
    };

    try {
      await retrieveNonSubmissionDetectionDetails(input);
      fail('Expected DetectionLogNotFound to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DetectionLogNotFound);
      expect((error as Error).message).toBe('検知ログが見つかりません。');
    }
  });
});
