// An in-memory cookie jar standing in for next/headers in route-handler tests.
// Registered for every test file in tests/setup.ts.
const jar = new Map<string, string>();

export const cookieJar = {
  clear: () => jar.clear(),
  get: (name: string) => jar.get(name),
  set: (name: string, value: string) => void jar.set(name, value),
};

export async function cookies() {
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  };
}

export async function headers() {
  return new Headers();
}
