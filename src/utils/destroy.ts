export interface Destroyable {
  destroy: () => void;
}

const destroyableMap: Map<any, Array<Destroyable>> = new Map();

export function destroy(key: any): void {
  if (destroyableMap.has(key)) {
    destroyableMap.get(key)!.forEach((item) => item.destroy());
    destroyableMap.delete(key);
  }
}
