import * as assert from 'assert';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { extractFileTags, getFileTitle } from '../../utils';
import {
  isMarkdownFile,
  purifyTag,
  extractTagsFromContent,
} from 'kainotes-tools';

suite('Utils Test Suite', () => {
  test('Test purifyTag() function', () => {
    assert.strictEqual(purifyTag('#js'), 'js');
    assert.strictEqual(purifyTag('js'), 'js');
  });

  test('Test extractTagsFromContent() function', () => {
    assert.deepStrictEqual(extractTagsFromContent('#js'), ['js']);
    assert.deepStrictEqual(extractTagsFromContent('#js #java'), ['js', 'java']);
    assert.deepStrictEqual(extractTagsFromContent('#js test#python'), ['js']);
    assert.deepStrictEqual(
      extractTagsFromContent(`#js
      something here #java bla bla bla
    `),
      ['js', 'java']
    );
    assert.strictEqual(
      extractTagsFromContent(`#123 http://fakeurl.com#456`),
      null
    );
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
