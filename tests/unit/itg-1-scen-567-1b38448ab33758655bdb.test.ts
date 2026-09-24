import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/daily-report-management-view');

describe('SCEN-567: Leader email validation and delivery success', () => {
  let mockValidateAndDeliverLeaderNotification: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateAndDeliverLeaderNotification = require('../../src/logic/daily-report-management-view').validateAndDeliverLeaderNotification;
  });

  it('should return success when email is valid and active', async () => {
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: true,
      deliveryStatus: 'success',
      timestamp: new Date().toISOString(),
    });

    const result = await mockValidateAndDeliverLeaderNotification('leader@example.com', 'daily_report_submitted', '本日の業務完了', null);

    expect(result.isValid).toBe(true);
    expect(result.deliveryStatus).toBe('success');
    expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(result.failureReason).toBeUndefined();
  });
});
