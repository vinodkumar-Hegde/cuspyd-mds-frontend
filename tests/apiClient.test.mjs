import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, test } from 'node:test';
import ts from 'typescript';

// Inject Vite's build-time setting while testing the actual service modules.
function compileModule(file, imports = {}) {
  let source = readFileSync(new URL(file, import.meta.url), 'utf8')
    .replaceAll('import.meta.env.VITE_API_URL', JSON.stringify('https://api.example.test'));
  for (const [specifier, url] of Object.entries(imports)) {
    source = source.replace(`from '${specifier}'`, `from ${JSON.stringify(url)}`);
  }
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}

const clientUrl = compileModule('../src/services/apiClient.ts');
const client = await import(clientUrl);
const exportsApi = await import(compileModule('../src/services/exportApi.ts', { './apiClient': clientUrl }));

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  globalThis.window = new EventTarget();
});

test('JSON requests use the configured API origin and shared authorization', async context => {
  client.storeToken('test-access-token');
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/v1/exams/example/submit');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-access-token');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { answers: { question: 1 } });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ score: 4 });
  });
  assert.deepEqual(await client.apiPost('/api/v1/exams/example/submit', { answers: { question: 1 } }), { score: 4 });
});

test('file exports share authentication and preserve the response filename', async context => {
  client.storeToken('test-access-token');
  let downloaded;
  const link = { click() {}, remove() {} };
  globalThis.document = { createElement: () => link, body: { appendChild() {} } };
  globalThis.window.setTimeout = callback => { callback(); return 1; };
  context.mock.method(URL, 'createObjectURL', blob => { downloaded = blob; return 'blob:test-export'; });
  context.mock.method(URL, 'revokeObjectURL', url => assert.equal(url, 'blob:test-export'));
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/v1/admin/exports/questions?format=csv&filter_by=subject_id&filter_value=oral+pathology');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-access-token');
    return new Response('id,text\n1,Example\n', {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="questions_export.csv"' },
    });
  });
  await exportsApi.exportData('questions', 'csv', 'subject_id', 'oral pathology');
  assert.equal(link.download, 'questions_export.csv');
  assert.equal(await downloaded.text(), 'id,text\n1,Example\n');
});

test('expired authentication during an export clears the session', async context => {
  client.storeToken('expired-token');
  let expired = 0;
  window.addEventListener(client.AUTH_EXPIRED, () => expired++);
  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: 'Session expired' }, { status: 401 }));
  await assert.rejects(exportsApi.exportData('questions', 'csv'), error => error instanceof client.ApiError && error.status === 401);
  assert.equal(client.token(), null);
  assert.equal(expired, 1);
});

test('empty successful responses are accepted', async context => {
  context.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  assert.equal(await client.apiDelete('/api/v1/admin/tests/example'), undefined);
});

test('validation errors keep the API field details', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    detail: [{ loc: ['body', 'mobile'], msg: 'Enter a valid mobile number' }],
  }, { status: 422 }));
  await assert.rejects(client.apiPost('/api/auth/register/request', {}), error =>
    error instanceof client.ApiError && error.status === 422 && error.message === 'mobile: Enter a valid mobile number');
});

test('network failures use the same API error format', async context => {
  context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Connection failed'); });
  await assert.rejects(client.apiGet('/api/v1/catalog'), error => error instanceof client.ApiError && error.status === 0);
});
