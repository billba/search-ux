/*
  pdf.js renders text in a way that makes it difficult to search. For example:

    [ the source text is][][divided into][spans of  text]
    [like this][with  varying spacing]
    [and line breaks]

  where [] denotes a <span>

  Say we're looking for the following text: 
  
    text\nlike this with varying spacing\nand

  That text probably originally comes from the same PDF, but parsed into plain text
  via Form Recognizer or perhaps a Python package like PyMuPDF. So we have an impedance
  mismatch between the two representations of the text.

  To make searching easier, and also to make it easier to map an arbitrary (x,y) to a given word in the text,
  we render each word (and any trailing spaces) into its own subspan, thus:

    [[ ][the ][source ][text ][is]][][[divided  ][into]][[spans ][of  ][text]]
    [[like ][this]][[with  ][varying ][spacing]]
    [[and ][line ][breaks]]

  Now we join the texts of all the non-empty subspans with a carriage return between them
    the 
    source 
    text 
    is
    divided 
    into
    spans 
    of  
    text
    like 
    this
    with  
    varying 
    spacing
    and 
    line 
    breaks

  `getSegments` then converts this into an array of segments, one for each word (with any trailing spaces),
  each segment includes the index value where it appears in the joined string.
  
  Then we turn the search string into a regular expression that is flexible about whitespace.

  Now it is easy to search for the regular expression in the joined text. When we find a match, we figure out
  which subspan it belongs to.
*/

export function* search(searchText: string, segments: Segment[]): Generator<{anchor: Text, focus: Text}> {
  const pageText = segments.map(segment => segment.textContent).join('\n');
  const searchTextRegExp = new RegExp(escape(searchText).replace(/\s+/g, '\\s+'), 'g');

  let match: RegExpExecArray | null;
  while ((match = searchTextRegExp.exec(pageText)) != null) {
    const matchIndex = match.index!;
    const matchLength = match[0].length;

    // if the below ever became a performance bottleneck, we could use a binary search
    const anchorIndex = segments.findIndex(({ index }) => index == matchIndex);
    const focusIndex = segments.findLastIndex(({ index, textContent }) => index + textContent.length <= matchIndex + matchLength + 1);
    
    console.assert(anchorIndex !== undefined);
    console.assert(focusIndex !== undefined);

    yield {
      anchor: segments[anchorIndex].text,
      focus: segments[focusIndex].text,
    }

    searchTextRegExp.lastIndex = match.index! + 1; // this lets us find overlapping matches, e.g. 'b c b' in 'a b c b c b'
  }
}

export interface Segment {
  text: Text,
  textContent: string,
  boundingBox: DOMRect,
  index: number,
}

export function getSegments(root: HTMLDivElement): Segment[] {
  let index = 0;
  return ([...root.children].filter(node => node instanceof HTMLSpanElement && node.innerText.length > 0) as HTMLSpanElement[])
    .map(span => ([...span.children] as HTMLSpanElement[])
      .map(wordspan => {
        const text = wordspan.firstChild as Text;
        const textContent = text.textContent!;
        const boundingBox = wordspan.getBoundingClientRect();

        const segment = {
          text,
          textContent,
          boundingBox,
          index,
        }

        index += textContent.length + 1;

        return segment;
      }))
    .flat()
}

function escape(text: string): string {
  return text.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function setSelection(segments: Segment[], searchText: string): void {
  const searching = search(searchText, segments);
  const { value, done } = searching.next();
  if (!done) {
    const { anchor, focus } = value!;
    const selection = window.getSelection();
    selection!.setBaseAndExtent(anchor, 0, focus, focus.textContent!.length);
  }
}

export function findSegment(
  segments: Segment[],
  x: number,
  y: number
): Segment | undefined {
  return segments.find(({ boundingBox: { left, right, top, bottom } }) =>
    x >= left &&
    x <= right &&
    y >= top &&
    y <= bottom
  );
}