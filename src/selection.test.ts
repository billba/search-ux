import { expect, test } from 'vitest'
import { search } from './selection'

const searchTest = (
  searchIn: string,
  searchFor: string,
  expected: [anchorId: number, anchorOffset: number, focusId: number, focusOffset: number][],
) => test(`searches |${searchIn}| for |${searchFor}|`, () => {
  const root = document.createElement('div');
  root.innerHTML = searchIn.split('|').map((s, i) => `<span id='${i}'>${s}</span>`).join('');
  const actual = [...search(searchFor, root)];
  expect(actual).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const { anchor, focus } = actual[i];
    const [anchorId, anchorOffset, focusId, focusOffset] = expected[i];
    expect(Number(anchor.span.id)).toBe(anchorId);
    expect(anchor.offset).toBe(anchorOffset);
    expect(Number(focus.span.id)).toBe(focusId);
    expect(focus.offset).toBe(focusOffset);
  }
});

searchTest('a b c|d e', 'b c', [[0, 2, 0, 5]]);
searchTest('a  b c|d e f', 'b c', [[0, 3, 0, 6]]);
searchTest('a b c|d e f', 'c d', [[0, 4, 1, 1]]);
searchTest('a b c|d e f', 'd', [[1, 0, 1, 1]]);
searchTest('a b c|d e f', 'b  c', [[0, 2, 0, 5]]);
searchTest('a b b c|d e f', 'b c', [[0, 4, 0, 7]]);
searchTest('a b c|d e f', 'b c d', [[0, 2, 1, 1]]);
searchTest('a b c |d e f', 'b c', [[0, 2, 0, 5]]);
searchTest('a b c |d e f', 'b c d', [[0, 2, 1, 1]]);
searchTest('a b c| d e f', 'b c d', [[0, 2, 1, 2]]);
searchTest('a b c | d e f', 'b c d', [[0, 2, 1, 2]]);
searchTest('a b c||d e f', 'c d', [[0, 4, 2, 1]]);
searchTest('a b c b c d', 'b c', [[0, 2, 0, 5], [0, 6, 0, 9]]);
searchTest('a b c|b c d', 'b c', [[0, 2, 0, 5], [1, 0, 1, 3]]);
searchTest('a b|c b c d', 'b c', [[0, 2, 1, 1],[1, 2, 1, 5]]);
// searchTest('a b c b c b', 'b c b', [[0, 2, 0, 7],[0, 6, 0, 11]]); // this fails because matchAll won't find overlaps