export function reverse<T extends Record<string, string>>(obj: T): {
  [V in T[keyof T]]: GetKeyByValue<T, V>
} {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[v] = Number(k)
    return acc
  }, {} as any)
}

export type GetKeyByValue<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

export function shallowCopy<T extends Record<string, any> | any[]>(o: T): T {
  if (Array.isArray(o)) {
    return o.slice() as T
  } else {
    return { ...o }
  }
}

export function signExtendTo16From5(_5bits: number): number {
  if (_5bits >> 4 === 1) {
    return (0xffff << 5) | _5bits
  }

  return _5bits
}

export function signExtendTo16From9(_9bits: number): number {
  if (_9bits >> 8 === 1) {
    return (0xffff << 9) | _9bits
  }

  return _9bits
}

export function to5Bits(n: number): number {
  return n & 0b0000_000_000_111_111
}

export function to9Bits(n: number): number {
  return n & 0b0000_000_111_111_111
}
