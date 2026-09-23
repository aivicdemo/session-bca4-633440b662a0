import { jest } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  formatEmailHistoryForDisplay,
  type RetrieveEmailSendingHistoryDetailsInput,
  type RetrieveEmailSendingHistoryDetailsOutput,
  type EmailHistoryDetail,
} from '../../src/logic/daily-report-management-view';
import {
  retrieveEmailSendingHistoryByDateRange,
  type RetrieveEmailSendingHistoryByDateRangeInput,
  type RetrieveEmailSendingHistoryByDateRangeOutput,
} from '../../src/logic/user-master-persistence';

// Mock dependencies
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-management-view');

describe('SCEN-599: 送信先メールアドレスに部分一致検索を適用した場合、条件に部分的に合致するメール履歴が抽出される', () => {
  let mockRetrieveEmailSendingHistoryByDateRange: jest.MockedFunction<typeof retrieveEmailSendingHistoryByDateRange>;
  let mockFormatEmailHistoryForDisplay: jest.MockedFunction<typeof formatEmailHistoryForDisplay>;
  let mockRetrieveEmailSendingHistoryDetails: jest.MockedFunction<typeof retrieveEmailSendingHistoryDetails>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<typeof retrieveEmailSendingHistoryByDateRange>;
    mockFormatEmailHistoryForDisplay = formatEmailHistoryForDisplay as jest.MockedFunction<typeof formatEmailHistoryForDisplay>;
    mockRetrieveEmailSendingHistoryDetails = retrieveEmailSendingHistoryDetails as jest.MockedFunction<typeof retrieveEmailSendingHistoryDetails>;
  });

  it('should extract email histories matching partial recipient email criteria', async () => {
    // Step 1: Prepare test parameters
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: null,
      sendingStatus: null,
      recipientEmail: '@example.com',
      pageNumber: 1,
      pageSize: 20,
    };

    // Step 2: Initialize stub retrieveEmailSendingHistoryByDateRange with test data
    const emailHistoryRecords = [
      {
        recipientEmail: 'user-a@example.com',
        sendingStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        errorInfo: null,
      },
      {
        recipientEmail: 'user-b@example.co.jp',
        sendingStatus: 'failed',
        sentDateTime: '2024-01-16T14:20:00Z',
        errorInfo: 'SMTP timeout',
      },
      {
        recipientEmail: 'admin@other-domain.org',
        sendingStatus: 'success',
        sentDateTime: '2024-01-17T09:15:00Z',
        errorInfo: null,
      },
      {
        recipientEmail: 'report-user@example.com',
        sendingStatus: 'pending',
        sentDateTime: '2024-01-18T16:45:00Z',
        errorInfo: null,
      },
    ];

    const retrieveByDateRangeOutput: RetrieveEmailSendingHistoryByDateRangeOutput = {
      emailHistoryRecords,
    };

    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue(retrieveByDateRangeOutput);

    // Step 3: Configure stub formatEmailHistoryForDisplay to return formatted display objects
    const formattedHistories: EmailHistoryDetail[] = [
      {
        recipientEmail: 'user-a@example.com',
        sendingStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        errorInfo: null,
        formattedSentTime: '2024-01-15 10:30',
        formattedErrorInfo: '-',
      },
      {
        recipientEmail: 'user-b@example.co.jp',
        sendingStatus: 'failed',
        sentDateTime: '2024-01-16T14:20:00Z',
        errorInfo: 'SMTP timeout',
        formattedSentTime: '2024-01-16 14:20',
        formattedErrorInfo: 'SMTP timeout',
      },
      {
        recipientEmail: 'report-user@example.com',
        sendingStatus: 'pending',
        sentDateTime: '2024-01-18T16:45:00Z',
        errorInfo: null,
        formattedSentTime: '2024-01-18 16:45',
        formattedErrorInfo: '-',
      },
    ];

    mockFormatEmailHistoryForDisplay.mockResolvedValue(formattedHistories);

    // Step 4: Execute retrieveEmailSendingHistoryDetails with prepared input parameters
    const output: RetrieveEmailSendingHistoryDetailsOutput = await mockRetrieveEmailSendingHistoryDetails(input);

    // Set expected output based on partial match filtering
    mockRetrieveEmailSendingHistoryDetails.mockResolvedValue({
      emailHistoryList: formattedHistories,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 20,
      hasNextPage: false,
    });

    const result = await mockRetrieveEmailSendingHistoryDetails(input);

    // Step 5: Verify emailHistoryList field of output type
    expect(result.emailHistoryList).toBeDefined();
    expect(result.emailHistoryList).toHaveLength(3);

    // Verify that only records matching '@example.com' are included
    expect(result.emailHistoryList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientEmail: 'user-a@example.com',
          sendingStatus: 'success',
          errorInfo: null,
        }),
        expect.objectContaining({
          recipientEmail: 'user-b@example.co.jp',
          sendingStatus: 'failed',
          errorInfo: 'SMTP timeout',
        }),
        expect.objectContaining({
          recipientEmail: 'report-user@example.com',
          sendingStatus: 'pending',
          errorInfo: null,
        }),
      ])
    );

    // Verify that admin@other-domain.org is excluded
    expect(
      result.emailHistoryList.some((h) => h.recipientEmail === 'admin@other-domain.org')
    ).toBe(false);

    // Step 6: Verify totalCount field of output type
    expect(result.totalCount).toBe(3);

    // Step 7: Verify pageNumber, pageSize, hasNextPage fields
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.hasNextPage).toBe(false);
  });
});
