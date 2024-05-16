export function setSelection(searchText: string): boolean {
  const root = document.getElementsByClassName('react-pdf__Page__textContent')[0] as HTMLDivElement;
  const spans = [...root.childNodes].filter(node => node instanceof HTMLSpanElement) as HTMLSpanElement[];
  
  const normalizedSourceText = spans.map(span => span.innerText).join(' ').replace(/\s+/g,' ').trim();
  console.assert(normalizedSourceText.indexOf("\n") == -1);
  console.log("page text", normalizedSourceText);

  const normalizedSearchText = searchText.replaceAll('\n', ' ').replace(/\s+/g,' ').trim();
  console.log("search text", normalizedSearchText);

  // right now let's just find the first instance of the text
  const location = normalizedSourceText.indexOf(normalizedSearchText);
  console.log("location of search text in page text", location);

  if (location == -1) {
    return false;
  }

  let anchorNode: HTMLSpanElement | undefined = undefined;
  let anchorOffset = 0;

  let focusNode: HTMLSpanElement | undefined = undefined;
  let focusOffset = 0;
 
  let offset = 0;

  for (const span of spans) {
    const innerText = span.innerText;

    if (!anchorNode && offset + innerText.length > location) {
      anchorNode = span;
      anchorOffset = location - offset;
    }

    if (anchorNode && offset + innerText.length > location + searchText.length) {
      focusNode = span;
      focusOffset = location + searchText.length - offset;
      break;
    }

    offset += innerText.length + 1;
  }

  document.getSelection()!.setBaseAndExtent(anchorNode!.firstChild!, anchorOffset, focusNode!.firstChild!, focusOffset);

  return true;
}