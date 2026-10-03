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
} from '../../src/logic/user-master-persistence';

describe('SCEN-355: メールアドレス重複エラー', () => {
  it('同じメールアドレスが既に別の報告者に登録されており、新規登録操作の場合、br-tx_7-004の制約3により「このメールアドレスは既に使用されています」エラーメッセージが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp,
    };

    (validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    (validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: null,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: 'DUPLICATE_EMAIL',
    });

    (validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: 'USER-001',
      inactiveReason: null,
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に使用されています');
    expect(result.changeHistoryId).toBeNull();

    expect(registerReporterToMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
