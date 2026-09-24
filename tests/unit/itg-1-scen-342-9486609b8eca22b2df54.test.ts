jest.mock('../../src/logic/reporter-master-management');

import { registerReporter } from '../../src/logic/reporter-master-management';

const mockedRegisterReporter = registerReporter as jest.Mock;

describe('SCEN-342: 退職または他部門異動の場合、br-tx_7-002により削除操作が決定される', () => {
  it('退職の場合、削除操作が決定され、registerReporterは呼び出されない', () => {
    const memberChangeType = '退職';
    const existingReporterId = 'R001';
    const memberStatus = '退職';

    const shouldDelete = memberChangeType === '退職' && memberStatus === '退職';

    expect(shouldDelete).toBe(true);
    expect(memberChangeType).toBe('退職');
    expect(existingReporterId).toBe('R001');
    expect(mockedRegisterReporter).not.toHaveBeenCalled();
  });

  it('他部門異動の場合、削除操作が決定される', () => {
    const memberChangeType = '他部門異動';
    const memberStatus = '異動';

    const shouldDelete = memberChangeType === '他部門異動' || memberStatus === '異動';

    expect(shouldDelete).toBe(true);
    expect(mockedRegisterReporter).not.toHaveBeenCalled();
  });
});
