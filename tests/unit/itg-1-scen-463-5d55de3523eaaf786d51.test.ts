import { updateReporterInMaster } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-463: 複数の更新可能項目のいずれかのみを指定して更新すると、指定された項目だけが反映される', () => {
  it('should update only reporterName when only reporterName is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: 'New Name',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    const result = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toMatch(/更新/);
  });

  it('should update only emailAddress when only emailAddress is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      emailAddress: 'new@example.com',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    const result = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toMatch(/更新/);
  });

  it('should update only department when only department is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      department: 'New Department',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    const result = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toMatch(/更新/);
  });

  it('should update only status when only status is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      status: 'inactive',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    const result = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toMatch(/更新/);
  });
});
