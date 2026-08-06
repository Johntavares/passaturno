import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const rawPrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = rawPrisma;

export function withDbTimeout<T>(promise: Promise<T>, ms = 800): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Prisma query timed out after ${ms}ms`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const prisma = new Proxy(rawPrisma, {
  get(target, propKey, receiver) {
    const model = Reflect.get(target, propKey, receiver);
    if (typeof model === 'object' && model !== null) {
      return new Proxy(model, {
        get(modelTarget, methodKey) {
          const origMethod = Reflect.get(modelTarget, methodKey);
          if (typeof origMethod === 'function') {
            return function (...args: any[]) {
              const promise = origMethod.apply(modelTarget, args);
              if (promise && typeof promise.then === 'function') {
                return withDbTimeout(promise, 800);
              }
              return promise;
            };
          }
          return origMethod;
        },
      });
    }
    return model;
  },
});

