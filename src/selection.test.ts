import { expect, test } from 'vitest'
import { search } from './selection'

const searchTest = (
  searchIn: string,
  searchFor: string,
  anchorId: number,
  anchorOffset: number,
  focusId: number,
  focusOffset: number
) => test(`searches |${searchIn}| for |${searchFor}|`, () => {
  const root = document.createElement('div');
  root.innerHTML = searchIn.split('|').map((s, i) => `<span id='${i}'>${s}</span>`).join('');
  const results = search(searchFor, root);
  expect(results?.length).toBe(1);
  const { anchor, focus } = results![0];
  expect(Number(anchor.spanNode.id)).toBe(anchorId);
  expect(anchor.offset).toBe(anchorOffset);
  expect(Number(focus.spanNode.id)).toBe(focusId);
  expect(focus.offset).toBe(focusOffset);
});

searchTest('a b c|d e', 'b c', 0, 2, 0, 5);
searchTest('a  b c|d e f', 'b c', 0, 3, 0, 6);
searchTest('a b c|d e f', 'c d', 0, 4, 1, 1);
searchTest('a b c|d e f', 'd', 1, 0, 1, 1);
searchTest('a b c|d e f', 'b  c', 0, 2, 0, 5);
searchTest('a b b c|d e f', 'b c', 0, 4, 0, 7);
searchTest('a b c|d e f', 'b c d', 0, 2, 1, 1);
searchTest('a b c |d e f', 'b c', 0, 2, 0, 5);
searchTest('a b c |d e f', 'b c d', 0, 2, 1, 1);
searchTest('a b c| d e f', 'b c d', 0, 2, 1, 2);
searchTest('a b c | d e f', 'b c d', 0, 2, 1, 2);
