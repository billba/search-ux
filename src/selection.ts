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

  To overcome this, we normalize the source text by concatanating all the non-empty spans of text
  into a single string, adding spaces between each span, converting all runs of spaces
  into a single space, and trimming spaces from the beginning and end of the string:
  
    the source text is divided into spans of text like this with varying spacing and line breaks
 
  We similarly normalize the source text by removing all line breaks and removing extra spaces:
  
    text like this with varying spacing and
  
  Now we can easily search for the text in the normalized source text.
  
  Once we have the location of the text we just iterate through the spans to find the
  start ("anchor") and end ("focus") spans. Because we have messed with whitespace,
  we need to fuss just a little bit to find the precise offsets within the spans.
*/

interface SelectionPart {
  spanNode: HTMLSpanElement;
  textNode: Text;
  offset: number;
  text: string;
}

export function search(searchText: string, root: HTMLDivElement) {
  const spans = [...root.childNodes].filter(node => node instanceof HTMLSpanElement && node.innerText.length > 0) as HTMLSpanElement[];
  
  const normalizedSourceText = normalizedText(spans.map(span => span.innerText).join(' '));
  const normalizedSearchText = normalizedText(searchText);

  // right now let's just find the first instance of the text
  const location = normalizedSourceText.indexOf(normalizedSearchText);
  
  if (location == -1) {
    return;
  }

  let anchor: SelectionPart | undefined = undefined;
  let focus: SelectionPart | undefined = undefined;
 
  let index = 0;

  for (const spanNode of spans) {
    const textNode = spanNode.firstChild as Text;
    const innerText = normalizedText(textNode.textContent!);

    if (!anchor && index + innerText.length > location) {
      const offset = location - index;
      anchor = {
        spanNode,
        textNode,
        offset,
        text: innerText.substring(offset),
      }
    }

    if (anchor && index + innerText.length >= location + normalizedSearchText.length) {
      const offset = location + normalizedSearchText.length - index;
      focus = {
        spanNode,
        textNode,
        offset,
        text: innerText.substring(0, offset),
      }
      break;
    }

    index += innerText.length + 1;
  }

  if (!anchor || !focus)
    return;

  const isSameNode = anchor.spanNode == focus.spanNode;

  const startRegExp = searchRegExp(isSameNode ? normalizedSearchText : anchor.text, !isSameNode, false);
  const startText = anchor.textNode.textContent!;
  anchor.offset = startText.search(startRegExp);

  const endRegExp = searchRegExp(isSameNode ? normalizedSearchText : focus.text, false, !isSameNode);
  const endText = focus.textNode.textContent!.substring(isSameNode ? anchor.offset : 0);
  focus.offset = (isSameNode ? anchor.offset : 0) + endText.match(endRegExp)![0].length;

  return [{
    anchor,
    focus,
  }];
}

function normalizedText(text: string): string {
  return text.replace(/\s+/g,' ').trim();
}

function searchRegExp(text: string, start: boolean, end: boolean) {
  return new RegExp((end ? '^\\s*' : '') + text.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s+') + (start ? '\\s*$' : ''));
}

export function setSelection(searchText: string): void {
  const root = document.getElementsByClassName('react-pdf__Page__textContent')[0] as HTMLDivElement;
  const selection = search(searchText, root)?.[0];
  if (selection) {
    window.getSelection()!.setBaseAndExtent(selection.anchor.textNode, selection.anchor.offset, selection.focus.spanNode, selection.focus.offset);
  }
}