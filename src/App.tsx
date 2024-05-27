import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useCallback, useEffect, useRef } from 'react';

import { getSegments, findSegment, setSelection, type Segment } from './selection';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

import './App.css'

const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

function App() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(5);

  const prev = useCallback(() => setPageNumber(page => page == 0 ? page : page - 1), [])
  const next = useCallback(() => setPageNumber(page => page == (numPages ?? 0) - 1 ? page : page + 1), [numPages])
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => setNumPages(numPages), []);
  // const handler = useCallback((e) => { console.log("handling", e) }, [])
  const segments = useRef<Segment[]>();
  const onRenderTextLayerSuccess = useCallback(() => {
    segments.current = getSegments(document.getElementsByClassName('react-pdf__Page__textContent')[0] as HTMLDivElement);
    setSelection(segments.current, searchString);

    // document.addEventListener('mousemove', (event) => {
    //   const segment = findSegment(segments.current!, event.clientX, event.clientY);
    //   if (segment) {
    //     segment.text.parentElement!.style.backgroundColor = 'red';
    //   }
    // });
  }, []);

  const renderText = useCallback(({ str }: { str: string }) => str?.replace(/(\S+\s*)/gm, "<span style='position:static'>$&</span>"), []);

  return (
    <div id="app">
      <div>
        <p id='nav'>
          <span onClick={prev}>Prev</span>
          &nbsp;
          Page {pageNumber} of {numPages}
          &nbsp;
          <span onClick={next}>Next</span>
        </p>
        <Document file="./compressed.tracemonkey-pldi-09.pdf" onLoadSuccess={onDocumentLoadSuccess} >
          <Page pageNumber={pageNumber} onRenderTextLayerSuccess={onRenderTextLayerSuccess} customTextRenderer={renderText}>
            {/* <div id="dragBox" ref={dragBox} style={{ backgroundColor: 'blue', height: 20, width: 20, position: 'fixed', left: 50, top: 50 }} /> */}
          </Page>
        </Document>
      </div>
    </div>
  )
}

export default App
