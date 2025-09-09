import { describe, it, expect, vi } from 'vitest';
import { AsyncMutex } from '../processing.js';

describe('AsyncMutex', () => {

  describe('constructor-based operation', () => {
    it('should execute the default operation when do() is called without parameters', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result');
      const mutex = new AsyncMutex(mockOperation);

      const result = await mutex.do();

      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return the same promise when multiple calls are made concurrently', async () => {
      let resolveOperation: (value: string) => void;
      const operationPromise = new Promise<string>((resolve) => {
        resolveOperation = resolve;
      });
      const mockOperation = vi.fn().mockReturnValue(operationPromise);
      const mutex = new AsyncMutex(mockOperation);

      const promise1 = mutex.do();
      const promise2 = mutex.do();
      const promise3 = mutex.do();

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);

      resolveOperation!('result');
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(result3).toBe('result');
    });

    it('should allow new operations after the first completes', async () => {
      const mockOperation = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');
      const mutex = new AsyncMutex(mockOperation);

      const result1 = await mutex.do();
      expect(result1).toBe('first');
      expect(mockOperation).toHaveBeenCalledTimes(1);

      const result2 = await mutex.do();
      expect(result2).toBe('second');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in the default operation', async () => {
      const error = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(error);
      const mutex = new AsyncMutex(mockOperation);

      await expect(mutex.do()).rejects.toThrow(error);
      expect(mockOperation).toHaveBeenCalledTimes(1);

      const secondOperation = vi.fn().mockResolvedValue('success');
      const mutex2 = new AsyncMutex(secondOperation);
      const result = await mutex2.do();
      expect(result).toBe('success');
    });
  });

  describe('per-call operation', () => {
    it('should execute the provided operation', async () => {
      const mutex = new AsyncMutex<number>();
      const mockOperation = vi.fn().mockResolvedValue(42);

      const result = await mutex.do(mockOperation);

      expect(result).toBe(42);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return the same promise for concurrent calls with same operation type', async () => {
      const mutex = new AsyncMutex();
      let resolveOperation: (value: string) => void;
      const operationPromise = new Promise<string>((resolve) => {
        resolveOperation = resolve;
      });
      const mockOperation = vi.fn().mockReturnValue(operationPromise);

      const promise1 = mutex.do(mockOperation);
      const promise2 = mutex.do(mockOperation);
      const promise3 = mutex.do(mockOperation);

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);

      resolveOperation!('shared-result');
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toBe('shared-result');
      expect(result2).toBe('shared-result');
      expect(result3).toBe('shared-result');
    });

    it('should allow different operations with different types', async () => {
      const mutex = new AsyncMutex();
      
      const stringOp = vi.fn().mockResolvedValue('string-result');
      const numberOp = vi.fn().mockResolvedValue(123);

      const stringResult = await mutex.do(stringOp);
      const numberResult = await mutex.do(numberOp);

      expect(stringResult).toBe('string-result');
      expect(numberResult).toBe(123);
      expect(stringOp).toHaveBeenCalledTimes(1);
      expect(numberOp).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in per-call operations', async () => {
      const mutex = new AsyncMutex();
      const error = new Error('Operation failed');
      const failingOp = vi.fn().mockRejectedValue(error);

      await expect(mutex.do(failingOp)).rejects.toThrow(error);
      expect(failingOp).toHaveBeenCalledTimes(1);

      const successOp = vi.fn().mockResolvedValue('success');
      const result = await mutex.do(successOp);
      expect(result).toBe('success');
      expect(successOp).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when no operation is provided and no default is set', async () => {
      const mutex = new AsyncMutex();
      
      await expect(mutex.do()).rejects.toThrow('No operation provided and no default operation set');
    });
  });

  describe('mixed usage', () => {
    it('should allow overriding default operation with per-call operation', async () => {
      const defaultOp = vi.fn().mockResolvedValue('default');
      const mutex = new AsyncMutex(defaultOp);
      
      const customOp = vi.fn().mockResolvedValue('custom');
      
      const customResult = await mutex.do(customOp);
      expect(customResult).toBe('custom');
      expect(customOp).toHaveBeenCalledTimes(1);
      expect(defaultOp).not.toHaveBeenCalled();

      const defaultResult = await mutex.do();
      expect(defaultResult).toBe('default');
      expect(defaultOp).toHaveBeenCalledTimes(1);
    });

    it('should share lock between default and custom operations', async () => {
      let resolveDefault: (value: string) => void;
      const defaultPromise = new Promise<string>((resolve) => {
        resolveDefault = resolve;
      });
      const defaultOp = vi.fn().mockReturnValue(defaultPromise);
      const mutex = new AsyncMutex(defaultOp);

      const customOp = vi.fn().mockResolvedValue('custom');

      const defaultCall = mutex.do();
      const customCall = mutex.do(customOp);

      expect(defaultOp).toHaveBeenCalledTimes(1);
      expect(customOp).not.toHaveBeenCalled();
      expect(customCall).toBe(defaultCall);

      resolveDefault!('default');
      const [defaultResult, customResult] = await Promise.all([defaultCall, customCall]);

      expect(defaultResult).toBe('default');
      expect(customResult).toBe('default');
    });
  });

  describe('timing and concurrency', () => {
    it('should handle sequential slow operations', async () => {
      const mutex = new AsyncMutex();
      let callCount = 0;

      const slowOp = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          const currentCall = ++callCount;
          setTimeout(() => resolve(`result-${currentCall}`), 100);
        });
      });

      const result1 = await mutex.do(slowOp);
      expect(result1).toBe('result-1');

      const result2 = await mutex.do(slowOp);
      expect(result2).toBe('result-2');

      expect(slowOp).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate concurrent slow operations', async () => {
      const mutex = new AsyncMutex();
      let resolveOperation: (value: string) => void;
      
      const slowOp = vi.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolveOperation = resolve;
        });
      });

      const promises = [
        mutex.do(slowOp),
        mutex.do(slowOp),
        mutex.do(slowOp),
        mutex.do(slowOp),
        mutex.do(slowOp)
      ];

      expect(slowOp).toHaveBeenCalledTimes(1);

      resolveOperation!('shared-slow-result');
      const results = await Promise.all(promises);

      expect(results).toEqual([
        'shared-slow-result',
        'shared-slow-result',
        'shared-slow-result',
        'shared-slow-result',
        'shared-slow-result'
      ]);
    });

    it('should properly clean up after operation completes', async () => {
      const mutex = new AsyncMutex();
      const op1 = vi.fn().mockResolvedValue('first');
      const op2 = vi.fn().mockResolvedValue('second');

      await mutex.do(op1);
      expect(op1).toHaveBeenCalledTimes(1);

      await mutex.do(op2);
      expect(op2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid sequences of operations', async () => {
      const mutex = new AsyncMutex();
      const results: string[] = [];

      for (let i = 0; i < 5; i++) {
        const op = vi.fn().mockResolvedValue(`result-${i}`);
        const result = await mutex.do(op);
        results.push(result as string);
      }

      expect(results).toEqual(['result-0', 'result-1', 'result-2', 'result-3', 'result-4']);
    });
  });

  describe('edge cases', () => {
    it('should handle operations that return undefined', async () => {
      const mutex = new AsyncMutex<undefined>();
      const op = vi.fn().mockResolvedValue(undefined);

      const result = await mutex.do(op);
      expect(result).toBeUndefined();
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should handle operations that return null', async () => {
      const mutex = new AsyncMutex<null>();
      const op = vi.fn().mockResolvedValue(null);

      const result = await mutex.do(op);
      expect(result).toBeNull();
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should handle nested operations correctly', async () => {
      const mutex = new AsyncMutex<string>();
      
      const innerOp = vi.fn().mockResolvedValue('inner');
      const outerOp = vi.fn().mockImplementation(async () => {
        return 'outer';
      });

      const result = await mutex.do(outerOp);
      expect(result).toBe('outer');
      expect(outerOp).toHaveBeenCalledTimes(1);
    });
  });
});
