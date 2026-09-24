jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  InvalidFilterCriteriaError,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-591: 開始日が終了日より後、またはメールタイプが定義済み値以外の場合、InvalidFilterCriteriaError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('開始日が終了日より後の場合、InvalidFilterCriteriaErrorが発生する', async () => {
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
      throw new Error('InvalidFilterCriteriaErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof InvalidFilterCriteriaError)) {
        throw error;
      }
      expect(error.message).toBe('Invalid filter criteria: date range or email type is not valid.');
    }
  });

  it('メールタイプが定義済み値以外の場合、InvalidFilterCriteriaErrorが発生する', async () => {
    const input = {
      leaderId: 'leader-001',
      startDate: '2025-01-10',
      endDate: '2025-01-15',
      emailType: 'invalid_email_type',
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await retrieveEmailSendingHistoryDetails(input);
      throw new Error('InvalidFilterCriteriaErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof InvalidFilterCriteriaError)) {
        throw error;
      }
      expect(error.message).toBe('Invalid filter criteria: date range or email type is not valid.');
    }
  });
});
