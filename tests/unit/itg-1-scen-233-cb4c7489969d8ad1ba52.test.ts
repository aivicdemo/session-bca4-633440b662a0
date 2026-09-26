import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-233: detectNonSubmittedReportersAtDeadline - Invalid 24-hour Format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not accept invalid 24-hour format for deadline time', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '25:00', // Invalid: 25 hours
      teamId: 'team-001',
    };

    // Should throw an error for invalid time format
    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow();
  });

  it('should reject various invalid 24-hour formats', async () => {
    const invalidFormats = ['25:00', 'abc:00', '17:60', '-1:00', '17'];

    for (const invalidFormat of invalidFormats) {
      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:00:00Z',
        submissionDeadlineTime: invalidFormat,
        teamId: 'team-001',
      };

      await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow();
    }
  });
});
