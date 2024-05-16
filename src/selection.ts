export function setSelection(text: string): boolean {
  const root = document.getElementsByClassName('react-pdf__Page__textContent')[0] as HTMLDivElement;
  const children = [...root.childNodes].filter(node => node instanceof HTMLSpanElement) as HTMLSpanElement[];
  
  const allText = children.map(node => node.innerText).join(' ');
  console.log("page text", allText);

  const flattenedText = text.replaceAll('\n', ' ');
  console.log("search text", flattenedText);

  // right now let's just find the first instance of the text
  const first = allText.indexOf(flattenedText);
  console.log("location of search text in page text", first);

  if (first == -1) {
    return false;
  }

  let anchorNode: HTMLSpanElement | undefined = undefined;
  let anchorOffset = 0;

  let focusNode: HTMLSpanElement | undefined = undefined;
  let focusOffset = 0;
 
  let offset = 0;

  for (const node of children) {
    const innerText = node.innerText;

    if (!anchorNode && offset + innerText.length > first) {
      anchorNode = node;
      anchorOffset = first - offset;
    }

    if (anchorNode && offset + innerText.length > first + text.length) {
      focusNode = node;
      focusOffset = first + text.length - offset;
      break;
    }

    offset += innerText.length + 1;
  }

  document.getSelection()!.setBaseAndExtent(anchorNode!.firstChild!, anchorOffset, focusNode!.firstChild!, focusOffset);

  return true;
}