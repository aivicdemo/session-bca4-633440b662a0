jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, DuplicateEmailAddressDetected } from '../../src/logic/reporter-master-management';
import { validateEmailAddress, validateReporterNameFormat, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-333: 入力されたメールアドレスが既にマスタに登録されている場合、DuplicateEmailAddressDetectedエラーを返す', () => {
  const userId = 'USER001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada@example.com';
  const teamLeaderId = 'LEADER001';
  const executionTimestamp = new Date('2024-01-15T09:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue(true);
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockRejectedValue(new Error('Should not be called'));
    mockedPersistReporterMasterChangeHistory.mockRejectedValue(new Error('Should not be called'));
  });

  it('重複するメールアドレスが検出され、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
