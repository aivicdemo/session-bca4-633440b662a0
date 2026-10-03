import { retrieveEmailSendingHistoryDetails, InvalidFilterCriteriaError } from '../../src/logic/daily-report-management-view';
import type { RetrieveEmailSendingHistoryDetailsInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-591: 開始日が終了日より後、またはメールタイプが定義済み値以外の場合、InvalidFilterCriteriaError を発生させる', () => {
  it('should throw InvalidFilterCriteriaError when start date is after end date', async () => {
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

  it('should throw InvalidFilterCriteriaError when email type is not a defined value', async () => {
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2025-01-10',
      endDate: '2025-01-15',
      emailType: 'invalid_email_type',
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
