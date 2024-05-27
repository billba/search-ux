import { expect, test } from 'vitest'
import { search, getSegments } from './selection'

const searchTest = (
  searchIn: string,
  searchFor: string,
  expected: [anchorIndex: number, focusIndex: number][],
) => test(`searches |${searchIn}| for |${searchFor}|`, () => {
  const root = document.createElement('div');
  root.innerHTML = searchIn
    .split('|')
    .map(s => s.replace(/(\S+\s*)/gm, '<span>$&</span>'))
    .map(s => `<span>${s}</span>`)
    .join('');
  const segments = getSegments(root);
  const actual = [...search(searchFor, segments)];
  expect(actual).toHaveLength(expected.length);

  for (let i = 0; i < expected.length; i++) {
    const { anchor, focus } = actual[i];
    const [expectedAnchorIndex, expectedFocusIndex] = expected[i];

    const actualAnchorIndex = segments.findIndex(({ text }) => text === anchor);
    const actualFocusIndex = segments.findIndex(({ text }) => text === focus);

    expect(actualAnchorIndex).toBe(expectedAnchorIndex);
    expect(actualFocusIndex).toBe(expectedFocusIndex);
  }
});

searchTest('a b c|d e', 'b c', [[1, 2]]);
searchTest('a  b c|d e f', 'b c', [[1, 2]]);
searchTest('a b c|d e f', 'c d', [[2, 3]]);
searchTest('a b c|d e f', 'd', [[3, 3]]);
searchTest('a b c|d e f', 'b  c', [[1, 2]]);
searchTest('a b b c|d e f', 'b c', [[2, 3]]);
searchTest('a b c|d e f', 'b c d', [[1, 3]]);
searchTest('a b c |d e f', 'b c', [[1, 2]]);
searchTest('a b c |d e f', 'b c d', [[1, 3]]);
searchTest('a b c| d e f', 'b c d', [[1, 3]]);
searchTest('a b c | d e f', 'b c d', [[1, 3]]);

// empty spans
searchTest('a b c||d e f', 'c d', [[2, 3]]);

// multiple matches
searchTest('a b c b c d', 'b c', [[1, 2], [3, 4]]);
searchTest('a b c|b c d', 'b c', [[1, 2], [3, 4]]);
searchTest('a b|c b c d', 'b c', [[1, 2], [3, 4]]);

// multiple overlapping matches
searchTest('a b c b c b', 'b c b', [[1, 3],[3, 5]]);