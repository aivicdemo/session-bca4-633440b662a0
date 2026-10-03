import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  retrieveReporterByUserId: jest.fn(),
}));

import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
  retrieveReporterByUserId,
} from '../../src/logic/user-master-persistence';

describe('SCEN-356: 報告者ID重複エラー', () => {
  it('同じ報告者IDが既に別のメールアドレスで登録されており、新規登録操作の場合、br-tx_7-004の制約4により「この報告者IDは既に登録されています」エラーメッセージが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp,
    };

    (validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '重複ID報告者',
      errorCode: null,
    });

    (validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'duplicate-id@example.com',
      errorCode: null,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'duplicate-id@example.com',
      errorCode: null,
    });

    (validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: 'USER-TL001',
      inactiveReason: null,
    });

    (retrieveReporterByUserId as jest.Mock).mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'USER-NEW001',
        userId: 'USER-NEW001',
        reporterName: '既存報告者',
        emailAddress: 'old-email@example.com',
        department: '営業部',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: undefined,
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('この報告者IDは既に登録されています');
    expect(result.changeHistoryId).toBeNull();

    expect(registerReporterToMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
