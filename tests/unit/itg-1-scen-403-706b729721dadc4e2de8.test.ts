import {
  judgeUserInformationApprovalDeadlineExceeded,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-information-input-confirmation', () => {
  const actual = jest.requireActual('../../src/logic/user-information-input-confirmation');
  return {
    ...actual,
    judgeUserInformationApprovalDeadlineExceeded: jest.fn(),
  };
});

describe('SCEN-403: 承認期限を1日超過した場合、警告レベルが注意と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1 day overdue returns warningLevel as warning', () => {
    const notificationDate = new Date('2024-01-05T09:00:00');
    const currentTimestamp = new Date('2024-01-09T09:00:00');

    (judgeUserInformationApprovalDeadlineExceeded as jest.Mock).mockReturnValue({
      userInfoId: 'user-info-12345',
      isDeadlineExceeded: true,
      daysOverdue: 1,
      warningLevel: 'warning',
    });

    const result = judgeUserInformationApprovalDeadlineExceeded({
      userInfoId: 'user-info-12345',
      notificationTimestamp: notificationDate,
      approvalDeadlineDays: 3,
      currentTimestamp,
    });

    expect(result.userInfoId).toBe('user-info-12345');
    expect(result.isDeadlineExceeded).toBe(true);
    expect(result.daysOverdue).toBe(1);
    expect(result.warningLevel).toBe('warning');
  });
});
