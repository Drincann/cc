export class ScopedMap<K, V> extends Map<K, V> {
  constructor(private readonly parent: Map<K, V>) {
    super()
    if (!parent) {
      this.parent = new Map()
    }
  }

  getSubScope(): ScopedMap<K, V> {
    return new ScopedMap(this)
  }

  getParentScope(): ScopedMap<K, V> {
    if (this.parent instanceof ScopedMap) {
      return this.parent
    }

    throw new Error('Current scope is the root scope, cannot get parent scope')
  }

  get(key: K): V | undefined {
    return super.get(key) ?? this.parent.get(key)
  }

  set(key: K, value: V): this {
    super.set(key, value)
    return this
  }

  delete(key: K): boolean {
    return super.delete(key) || this.parent.delete(key)
  }

  has(key: K): boolean {
    return super.has(key) || this.parent.has(key)
  }

  scopeHas(key: K): boolean {
    return super.has(key)
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this.parent.forEach(callbackfn, thisArg)
    super.forEach(callbackfn, thisArg)
  }

  clear(): void {
    super.clear()
    this.parent.clear()
  }

  entries(): IterableIterator<[K, V]> {
    // concat two iterators
    return new Map([...this.parent.entries(), ...super.entries()]).entries()
  }

  keys(): IterableIterator<K> {
    return new Map([...this.parent.entries(), ...super.entries()]).keys()
  }

  values(): IterableIterator<V> {
    return new Map([...this.parent.entries(), ...super.entries()]).values()
  }
}
