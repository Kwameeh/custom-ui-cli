/**
 * Tests for user feedback utilities
 */

import { ConsoleFeedback, SilentFeedback, FeedbackFactory, FeedbackUtils } from '../user-feedback';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock process.stdout.write
const mockStdoutWrite = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.console = mockConsole as any;
  global.process.stdout.write = mockStdoutWrite;
});

describe('ConsoleFeedback', () => {
  let feedback: ConsoleFeedback;

  beforeEach(() => {
    feedback = new ConsoleFeedback();
  });

  describe('success', () => {
    it('should log success message with green color and checkmark', () => {
      feedback.success('Operation completed');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Operation completed')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[32m') // Green color
      );
    });
  });

  describe('error', () => {
    it('should log error message with red color and X mark', () => {
      feedback.error('Something went wrong');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Something went wrong')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[31m') // Red color
      );
    });

    it('should log stack trace in debug mode', () => {
      const originalEnv = process.env.DEBUG;
      process.env.DEBUG = 'true';
      
      const error = new Error('Test error');
      feedback.error('Error occurred', error);
      
      expect(mockConsole.error).toHaveBeenCalledTimes(2);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(error.stack!)
      );
      
      process.env.DEBUG = originalEnv;
    });
  });

  describe('warning', () => {
    it('should log warning message with yellow color and warning icon', () => {
      feedback.warning('This is a warning');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ This is a warning')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[33m') // Yellow color
      );
    });
  });

  describe('info', () => {
    it('should log info message with blue color and info icon', () => {
      feedback.info('Information message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ Information message')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[34m') // Blue color
      );
    });
  });

  describe('progress', () => {
    it('should create a progress indicator', () => {
      const progress = feedback.progress({
        total: 10,
        message: 'Processing...',
        showPercentage: true
      });
      
      expect(progress).toBeDefined();
      expect(typeof progress.update).toBe('function');
      expect(typeof progress.increment).toBe('function');
      expect(typeof progress.complete).toBe('function');
      expect(typeof progress.fail).toBe('function');
    });
  });
});

describe('SilentFeedback', () => {
  let feedback: SilentFeedback;

  beforeEach(() => {
    feedback = new SilentFeedback();
  });

  it('should store success messages', () => {
    feedback.success('Success message');
    
    const messages = feedback.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      type: 'success',
      message: 'Success message'
    });
  });

  it('should store error messages with error object', () => {
    const error = new Error('Test error');
    feedback.error('Error message', error);
    
    const messages = feedback.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      type: 'error',
      message: 'Error message',
      error
    });
  });

  it('should store warning messages', () => {
    feedback.warning('Warning message');
    
    const messages = feedback.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      type: 'warning',
      message: 'Warning message'
    });
  });

  it('should store info messages', () => {
    feedback.info('Info message');
    
    const messages = feedback.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      type: 'info',
      message: 'Info message'
    });
  });

  it('should clear messages', () => {
    feedback.success('Message 1');
    feedback.error('Message 2');
    
    expect(feedback.getMessages()).toHaveLength(2);
    
    feedback.clear();
    expect(feedback.getMessages()).toHaveLength(0);
  });

  it('should create silent progress indicator', () => {
    const progress = feedback.progress({
      total: 5,
      message: 'Testing...'
    });
    
    expect(progress).toBeDefined();
    
    // Test progress functionality
    progress.update(2, 'Updated message');
    progress.increment();
    progress.complete('Done');
    
    // Silent progress should not output to console
    expect(mockConsole.log).not.toHaveBeenCalled();
    expect(mockStdoutWrite).not.toHaveBeenCalled();
  });
});

describe('FeedbackFactory', () => {
  it('should create console feedback by default', () => {
    const feedback = FeedbackFactory.create();
    expect(feedback).toBeInstanceOf(ConsoleFeedback);
  });

  it('should create console feedback when specified', () => {
    const feedback = FeedbackFactory.create('console');
    expect(feedback).toBeInstanceOf(ConsoleFeedback);
  });

  it('should create silent feedback when specified', () => {
    const feedback = FeedbackFactory.create('silent');
    expect(feedback).toBeInstanceOf(SilentFeedback);
  });
});

describe('FeedbackUtils', () => {
  let silentFeedback: SilentFeedback;

  beforeEach(() => {
    silentFeedback = new SilentFeedback();
  });

  describe('withProgress', () => {
    it('should execute operation with progress and complete on success', async () => {
      const operation = jest.fn(async (progress) => {
        progress.update(50, 'Halfway done');
        return 'result';
      });

      const result = await FeedbackUtils.withProgress(
        operation,
        { total: 100, message: 'Testing...' },
        silentFeedback
      );

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Verify progress was passed to operation
      const progressArg = operation.mock.calls[0][0];
      expect(typeof progressArg.update).toBe('function');
    });

    it('should fail progress and rethrow error on operation failure', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(
        FeedbackUtils.withProgress(
          operation,
          { total: 100, message: 'Testing...' },
          silentFeedback
        )
      ).rejects.toThrow('Operation failed');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('withSteps', () => {
    it('should execute all steps with progress tracking', async () => {
      const step1 = jest.fn().mockResolvedValue('result1');
      const step2 = jest.fn().mockResolvedValue('result2');
      const step3 = jest.fn().mockResolvedValue('result3');

      const steps = [
        { name: 'Step 1', operation: step1 },
        { name: 'Step 2', operation: step2 },
        { name: 'Step 3', operation: step3 }
      ];

      const results = await FeedbackUtils.withSteps(steps, silentFeedback);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(step1).toHaveBeenCalledTimes(1);
      expect(step2).toHaveBeenCalledTimes(1);
      expect(step3).toHaveBeenCalledTimes(1);
    });

    it('should fail and rethrow error if any step fails', async () => {
      const step1 = jest.fn().mockResolvedValue('result1');
      const step2 = jest.fn().mockRejectedValue(new Error('Step 2 failed'));
      const step3 = jest.fn().mockResolvedValue('result3');

      const steps = [
        { name: 'Step 1', operation: step1 },
        { name: 'Step 2', operation: step2 },
        { name: 'Step 3', operation: step3 }
      ];

      await expect(
        FeedbackUtils.withSteps(steps, silentFeedback)
      ).rejects.toThrow('Step 2 failed');

      expect(step1).toHaveBeenCalledTimes(1);
      expect(step2).toHaveBeenCalledTimes(1);
      expect(step3).not.toHaveBeenCalled(); // Should not reach step 3
    });

    it('should handle empty steps array', async () => {
      const results = await FeedbackUtils.withSteps([], silentFeedback);
      expect(results).toEqual([]);
    });
  });
});

describe('ConsoleProgressIndicator', () => {
  let feedback: ConsoleFeedback;

  beforeEach(() => {
    feedback = new ConsoleFeedback();
  });

  it('should render progress bar on creation', () => {
    feedback.progress({
      total: 10,
      message: 'Loading...',
      showPercentage: true
    });

    expect(mockStdoutWrite).toHaveBeenCalled();
    const output = mockStdoutWrite.mock.calls[0][0];
    expect(output).toContain('Loading...');
    expect(output).toContain('0%');
  });

  it('should update progress correctly', () => {
    const progress = feedback.progress({
      total: 10,
      message: 'Processing...'
    });

    progress.update(5, 'Half done');

    expect(mockStdoutWrite).toHaveBeenCalledTimes(2); // Initial + update
    const output = mockStdoutWrite.mock.calls[1][0];
    expect(output).toContain('Half done');
    expect(output).toContain('50%');
  });

  it('should increment progress correctly', () => {
    const progress = feedback.progress({
      total: 10,
      message: 'Processing...'
    });

    progress.increment('Step completed');

    expect(mockStdoutWrite).toHaveBeenCalledTimes(2); // Initial + increment
    const output = mockStdoutWrite.mock.calls[1][0];
    expect(output).toContain('Step completed');
    expect(output).toContain('10%');
  });

  it('should complete progress with success message', () => {
    const progress = feedback.progress({
      total: 5,
      message: 'Processing...'
    });

    progress.complete('All done!');

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Completed in')
    );
  });

  it('should fail progress with error message', () => {
    const progress = feedback.progress({
      total: 5,
      message: 'Processing...'
    });

    progress.fail('Something went wrong');

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('❌ Something went wrong')
    );
  });
});