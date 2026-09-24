jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, InvalidEmailAddressFormat } from '../../src/logic/reporter-master-management';
import { validateEmailAddress, validateReporterNameFormat, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-332: メールアドレスが標準的なメールアドレス形式に違反している場合、InvalidEmailAddressFormatエラーを返す', () => {
  const validUserId = 'valid-user-id';
  const validReporterName = '有効な報告者名';
  const invalidEmailAddress = 'invalid-email-format';
  const validTeamLeaderId = 'valid-team-leader-id';
  const executionTimestamp = new Date('2024-01-15T09:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockRejectedValue(new InvalidEmailAddressFormat('Invalid email format'));
    mockedDetectDuplicateEmailAddress.mockResolvedValue(false);
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
  });

  it('メールアドレス形式違反によりInvalidEmailAddressFormatエラーが発生し、success=false、reporterId=null、message と changeHistoryId=null を返す', async () => {
    const input = {
      userId: validUserId,
      reporterName: validReporterName,
      emailAddress: invalidEmailAddress,
      teamLeaderId: validTeamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
