import * as assert from 'assert';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {
  checkTags,
  extractFileTags,
  getFileTitle,
  isMarkdownFile,
  purifyTag,
} from '../../utils';

suite('Utils Test Suite', () => {
  test('Test purifyTag() function', () => {
    assert.strictEqual(purifyTag('#js'), 'js');
    assert.strictEqual(purifyTag('js'), 'js');
  });

  test('Test checkTags() function', () => {
    assert.deepStrictEqual(checkTags('#js'), ['js']);
    assert.deepStrictEqual(checkTags('#js #java'), ['js', 'java']);
    assert.deepStrictEqual(checkTags('#js test#python'), ['js']);
    assert.deepStrictEqual(
      checkTags(`#js
      something here #java bla bla bla
    `),
      ['js', 'java']
    );
    assert.strictEqual(checkTags(`#123 http://fakeurl.com#456`), null);
  });

  test('Test isMarkdownFile() function', () => {
    assert.strictEqual(isMarkdownFile('test.md'), true);
    assert.strictEqual(isMarkdownFile('test.markdown'), true);
    assert.strictEqual(isMarkdownFile('test.mds'), false);
    assert.strictEqual(isMarkdownFile('../test.md'), true);
    assert.strictEqual(isMarkdownFile('/Users/dev/test.md'), true);
    assert.strictEqual(isMarkdownFile('/Users/dev/test.markdown'), true);
  });

  test('Test extractFileTags() Function', async () => {
    const filePath = process.cwd() + '/src/test/files-for-test/index.md';
    assert.deepStrictEqual(await extractFileTags(filePath), [
      'vscode',
      'javascript',
    ]);
  });

  test('Test getFileTitle() Function', async () => {
    const filePath = process.cwd() + '/src/test/files-for-test/index.md';
    assert.strictEqual(
      await getFileTitle(filePath),
      'This is a markdown file for test'
    );
  });
});
