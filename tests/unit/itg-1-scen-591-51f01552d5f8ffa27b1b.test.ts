import { describe, it, expect } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  InvalidFilterCriteriaError,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-591: 開始日が終了日より後、またはメールタイプが定義済み値以外の場合、InvalidFilterCriteriaErrorを発生させる', () => {
  it('should throw InvalidFilterCriteriaError when startDate is after endDate', async () => {
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2025-01-15',
      endDate: '2025-01-10',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(InvalidFilterCriteriaError);
    await expect(retrieveEmailSendingHistoryDetails(input)).rejects.toThrow(
      'Invalid filter criteria: date range or email type is not valid.'
    );
  });
});
