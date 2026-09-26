import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  InvalidLeaderEmailAddressError,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

const mockModule = require('../../src/logic/email-notification-management');
const mockValidateEmailAddressForDelivery = mockModule.validateEmailAddressForDelivery as jest.MockedFunction<typeof validateEmailAddressForDelivery>;

describe('SCEN-553: リーダーのメールアドレス形式が無効な場合、InvalidLeaderEmailAddressErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーのメールアドレス形式が無効な場合、InvalidLeaderEmailAddressErrorが発生する', async () => {
    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'Invalid email format',
      errorCode: 'INVALID_FORMAT',
    });

    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'leader-002',
    };

    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      InvalidLeaderEmailAddressError
    );
    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      'リーダーのメールアドレスが無効です。管理者に通知してください。'
    );

    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'invalid-email-format',
        recipientType: 'leader',
      })
    );
  });
});
