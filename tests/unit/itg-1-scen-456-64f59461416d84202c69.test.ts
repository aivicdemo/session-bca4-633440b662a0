import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporterToMaster,
  RegisterReporterToMasterInput,
  RegisterReporterToMasterOutput,
  ReporterRegistrationFailedError,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-456: データベース障害により登録処理が失敗した場合、登録失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with database error when persistence operation throws', async () => {
    const input: RegisterReporterToMasterInput = {
      reporterName: '新規報告者',
      emailAddress: 'new.reporter@example.com',
      department: '営業部',
      leaderUserId: 'leader-001',
      registrationTimestamp: new Date(),
    };

    (validateUserInformationRequired as any).mockReturnValue(true) as any;
    (validateEmailAddress as any).mockReturnValue(true) as any;
    (detectDuplicateEmailAddress as any).mockReturnValue(false) as any;
    (persistReporterMasterChangeHistory as any).mockRejectedValue(
      new ReporterRegistrationFailedError('Database error') as any
    );

    const result: RegisterReporterToMasterOutput = await registerReporterToMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者の登録に失敗しました。システム管理者に連絡してください。');
  });
});