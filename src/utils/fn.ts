/**
 * Function Utils
 */

export function throttle(fn: () => void, ctx?: any): any {
  let pending = false;
  let first = true;

  return function (...args: any) {
    if (first) {
      first = false;
      return fn.apply(ctx, args);
    }

    if (pending) {
      return;
    }

    pending = true;

    requestAnimationFrame(() => {
      fn.apply(ctx, args);
      pending = false;
    });
  };
}

export function throttleTime(fn: () => void, time = 0, ctx?: any) {
  let pending = false;
  let first = true;

  return function (...args: any) {
    if (first) {
      first = false;
      return fn.apply(ctx, args);
    }

    if (pending) {
      return;
    }

    pending = true;

    setTimeout(() => {
      fn.apply(ctx, args);
      pending = false;
    }, time);
  };
}

export function getChangedAttrs<T extends Record<string, any>>(
  newV: Partial<T>,
  oldV: Partial<T>,
  updateOld = false,
) {
  const patch: [keyof T, Partial<T>[keyof T], Partial<T>[keyof T]][] = [];
  Object.keys(newV).forEach((x: keyof T) => {
    if (newV[x] !== oldV[x]) {
      patch.push([x, newV[x], oldV[x]]);
      if (updateOld) {
        oldV[x] = newV[x];
      }
    }
  });
  return patch;
}

export function clamp(n: number, lower = 0, upper = 1): number {
  return Math.max(Math.min(n, upper), lower);
}

/**
 * Globally Unique Identifier
 * @returns {string}
 */
export function guid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
