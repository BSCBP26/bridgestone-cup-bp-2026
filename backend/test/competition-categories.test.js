import assert from 'node:assert/strict';
import test from 'node:test';
import { clearCategorySettings } from '../src/modules/competition-categories/competition-categories.repository.js';
import { getCategories, updateCategories } from '../src/modules/competition-categories/competition-categories.service.js';

test.beforeEach(() => clearCategorySettings());

test('category defaults preserve the existing competition data', async () => {
  assert.deepEqual(await getCategories('badminton'), { sport: 'badminton', activeCategories: ['doubles'], mode: 'doubles' });
  assert.deepEqual(await getCategories('table-tennis'), { sport: 'table-tennis', activeCategories: ['singles'], mode: 'singles' });
});

test('admin can activate singles only, doubles only, or both', async () => {
  assert.equal((await updateCategories('badminton', ['singles'])).mode, 'singles');
  assert.equal((await updateCategories('badminton', ['doubles'])).mode, 'doubles');
  assert.deepEqual((await updateCategories('badminton', ['doubles', 'singles'])).activeCategories, ['singles', 'doubles']);
});

test('unsupported sports and invalid categories are rejected', async () => {
  await assert.rejects(() => getCategories('fishing'), error => error.statusCode === 404);
  await assert.rejects(() => updateCategories('badminton', []), error => error.statusCode === 422);
  await assert.rejects(() => updateCategories('badminton', ['team']), error => error.statusCode === 422);
});
