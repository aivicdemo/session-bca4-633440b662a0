import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  InvalidFilterCriteriaError,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-591: 開始日が終了日より後、またはメールタイプが定義済み値以外の場合、InvalidFilterCriteriaError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('開始日が終了日より後の場合、InvalidFilterCriteriaErrorが発生し、エラー文言が「Invalid filter criteria: date range or email type is not valid.」である', async () => {
    const input = {
      leaderId: 'leader-001',
      startDate: '2025-01-15',
      endDate: '2025-01-10',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await retrieveEmailSendingHistoryDetails(input);
      fail('Expected InvalidFilterCriteriaError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidFilterCriteriaError);
      expect((error as Error).message).toBe(
        'Invalid filter criteria: date range or email type is not valid.'
      );
    }
  });
});
