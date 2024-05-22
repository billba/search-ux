/*
  pdf.js renders text in a way that makes it difficult to search. For example:

    [ the source text is][][divided into][spans of  text]
    [like this][with  varying spacing]
    [and line breaks]

  Say we're looking for the following text: 
  
    text\nlike this with varying spacing\nand

  That text probably originally comes from the same PDF, but parsed into plain text
  via Form Recognizer or perhaps a Python package like PyMuPDF. So we have an impedance
  mismatch between the two representations of the text.

  To do this we join the texts of all the non-empty spans, with a line break in between:
     the source text is
    divided into
    spans of  text
    like this
     with  varying spacing
    and line breaks

  Then we turn the search string into a regular expression that is flexible about whitespace.

  Then we search for the regular expression in the joined text. When we find a match, we figure out
  which span it belongs to using a handy lookup table which maps the start and end indices of each line
  to the origin span.
*/

export function* search(searchText: string, root: HTMLDivElement)  {
  const spans = [...root.childNodes].filter(node => node instanceof HTMLSpanElement && node.innerText.length > 0) as HTMLSpanElement[];
  const pageTexts = spans.map(span => span.innerText);

  let i = 0;
  const pageTextRanges = pageTexts.map(text => [i, i += text.length]);

  const pageText = pageTexts.join('\n');

  const searchTextRegExp = new RegExp(escape(searchText).replace(/\s+/g, '\\s+'), 'g');

  let match: RegExpMatchArray | null;
  while ((match = searchTextRegExp.exec(pageText)) != null) {
    const index = match.index!;
    const length = match[0].length;

    // if the below ever became a performance bottleneck, we could use a binary search
    const anchorIndex = pageTextRanges.findIndex(([start, end]) => start <= index && index < end);
    const focusIndex = pageTextRanges.findIndex(([start, end]) => start < index + length && index + length <= end);

    yield {
      anchor: {
        span: spans[anchorIndex],
        text: spans[anchorIndex].firstChild as Text,
        offset: index - pageTextRanges[anchorIndex][0] - anchorIndex,
      },
      focus: {
        span: spans[focusIndex],
        text: spans[focusIndex].firstChild as Text,
        offset: index + length - pageTextRanges[focusIndex][0] - focusIndex,
      },
    }

    searchTextRegExp.lastIndex = match.index! + 1; // this lets us find overlapping matches, e.g. 'b c b' in 'a b c b c b'
  }
}


function escape(text: string): string {
  return text.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function setSelection(searchText: string): void {
  const root = document.getElementsByClassName('react-pdf__Page__textContent')[0] as HTMLDivElement;
  const searching = search(searchText, root);
  const { value, done } = searching.next();
  if (!done) {
    const { anchor, focus } = value!;
    const selection = window.getSelection();
    selection!.setBaseAndExtent(anchor.text, anchor.offset, focus.text, focus.offset);
  }
}