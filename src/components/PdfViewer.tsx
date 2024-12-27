import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { makeStyles, Button, Input } from "@fluentui/react-components";
import { bundleIcon, ZoomInRegular, ZoomOutRegular, PrintRegular, DownloadRegular, PreviewLinkRegular } from "@fluentui/react-icons";
import { pdfjs, Document, Page } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "10px",
  },
  canvas: {
    border: "1px solid black",
  },
  thumbnailWrapper: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "10px",
  },
  thumbnail: {
    width: "100px",
    height: "auto",
    margin: "5px",
    cursor: "pointer",
  },
});

const ZoomInIcon = bundleIcon(ZoomInRegular, ZoomInRegular);
const ZoomOutIcon = bundleIcon(ZoomOutRegular, ZoomOutRegular);
const PrintIcon = bundleIcon(PrintRegular, PrintRegular);
const DownloadIcon = bundleIcon(DownloadRegular, DownloadRegular);
const PreviewIcon = bundleIcon(PreviewLinkRegular, PreviewLinkRegular);

const PdfViewer = ({ file }) => {
  const styles = useStyles();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const canvasRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => Math.min(Math.max(prevPageNumber + offset, 1), numPages));
  };

  const changeScale = (offset) => {
    setScale((prevScale) => Math.min(Math.max(prevScale + offset, 0.5), 2.0));
  };

  const printDocument = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.zIndex = "-1";
    iframe.src = file;
    document.body.appendChild(iframe);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    document.body.removeChild(iframe);
  };

  const downloadDocument = () => {
    const link = document.createElement("a");
    link.href = file;
    link.download = "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <Button icon={<ZoomOutIcon />} onClick={() => changeScale(-0.1)}>Zoom Out</Button>
        <Input type="number" value={Math.round(scale * 100)} onChange={(e) => setScale(Number(e.target.value) / 100)} />
        <Button icon={<ZoomInIcon />} onClick={() => changeScale(0.1)}>Zoom In</Button>
        <Button icon={<PrintIcon />} onClick={printDocument}>Print</Button>
        <Button icon={<DownloadIcon />} onClick={downloadDocument}>Download</Button>
        <Button icon={<PreviewIcon />} onClick={() => setShowThumbnails(!showThumbnails)}>Toggle Thumbnails</Button>
      </div>
      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} scale={scale} canvasRef={canvasRef} />
      </Document>
      <div className={styles.controls}>
        <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>Previous</Button>
        <Input type="number" value={pageNumber} onChange={(e) => setPageNumber(Number(e.target.value))} />
        <Button onClick={() => changePage(1)} disabled={pageNumber >= numPages}>Next</Button>
      </div>
      {showThumbnails && (
        <div className={styles.thumbnailWrapper}>
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`thumbnail_${index}`} onClick={() => setPageNumber(index + 1)}>
              <Document file={file}>
                <Page pageNumber={index + 1} scale={0.2} className={styles.thumbnail} />
              </Document>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
