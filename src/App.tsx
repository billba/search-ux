import 'react-pdf/dist/Page/TextLayer.css';

import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { useState, useCallback } from 'react';

import { setSelection } from './selection';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

import './App.css'

const searchString = 'Barnes\nbillba';

function App() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const prev = useCallback(() => setPageNumber(page => page == 0 ? page : page - 1), [])
  const next = useCallback(() => setPageNumber(page => page == (numPages ?? 0) - 1 ? page : page + 1), [numPages])
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => setNumPages(numPages), []);
  const onRenderTextLayerSuccess = useCallback(() => setSelection(searchString), []);

  return (
    <>
      <p>
        <span onClick={prev}>Prev</span>
        Page {pageNumber} of {numPages}
        <span onClick={next}>Next</span>
      </p>
      <Document file="./Bill.pdf" onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} onRenderTextLayerSuccess={onRenderTextLayerSuccess}/>
      </Document>
    </>
  )
}

export default App
