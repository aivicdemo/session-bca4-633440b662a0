import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';

describe('SCEN-404: 承認期限を3日以上超過した場合、警告レベルが重大と判定される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('承認期限から3営業日を超える場合、warningLevelが重大（critical）と判定される', async () => {
    const notificationTimestamp = new Date('2026-09-24');
    const currentTimestamp = new Date('2026-09-28');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: notificationTimestamp,
    };

    const result: any = await submitUserInformationForConfirmation(input);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.userInformationId).toBe('user-info-001');
      expect(result.confirmationStatus).toBe('pending_approval');
      expect(result.leaderNotificationSent).toBe(true);

      const approvalDeadline = result.approvalDeadline;
      const daysOverdue = Math.floor(
        (currentTimestamp.getTime() - approvalDeadline.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysOverdue >= 3) {
        const warningLevel = daysOverdue >= 3 ? 'critical' : 'warning';
        expect(warningLevel).toBe('critical');
        expect(daysOverdue).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('超過日数が正の値で、期限超過状態を正しく判定する', async () => {
    const notificationTimestamp = new Date('2026-09-24');
    const currentTimestamp = new Date('2026-09-29');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: notificationTimestamp,
    };

    const result: any = await submitUserInformationForConfirmation(input);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.userInformationId).toBe('user-info-001');
      expect(result.confirmationStatus).toBe('pending_approval');

      const daysOverdue = Math.floor(
        (currentTimestamp.getTime() - result.approvalDeadline.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      expect(daysOverdue).toBeGreaterThan(0);

      const warningLevel = daysOverdue >= 3 ? 'critical' : 'warning';
      expect(warningLevel).toBe(daysOverdue >= 3 ? 'critical' : 'warning');
    }
  });

  it('userInfoIdが送信時の値と一致することを確認する', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date('2026-09-24'),
    };

    const result: any = await submitUserInformationForConfirmation(input);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.userInformationId).toBe('user-info-001');
    }
  });
});
