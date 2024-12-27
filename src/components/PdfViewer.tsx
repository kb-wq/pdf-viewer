import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { makeStyles, Button, Input } from "@fluentui/react-components";
import {
  ZoomInRegular,
  ZoomOutRegular,
  PrintRegular,
  ArrowDownloadRegular,
  PreviewLinkRegular,
} from "@fluentui/react-icons";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  controls: {
    display: "flex",
    gap: "10px",
  },
  canvas: {
    border: "1px solid black",
  },
  thumbnailWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },
  thumbnail: {
    width: "100px",
    height: "auto",
    cursor: "pointer",
  },
});

const PdfViewer = () => {
  const styles = useStyles();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument("/document.pdf");
    loadingTask.promise.then((loadedPdf: PDFDocumentProxy) => {
      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    });
  }, []);

  useEffect(() => {
    if (pdf) {
      renderPage(pageNumber);
    }
  }, [pdf, pageNumber, scale]);

  interface RenderContext {
    canvasContext: CanvasRenderingContext2D;
    viewport: pdfjsLib.PageViewport;
  }

  const renderPage = (pageNum: number) => {
    if (!pdf) return;
    pdf.getPage(pageNum).then((page: pdfjsLib.PDFPageProxy) => {
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current as HTMLCanvasElement | null;
      if (!canvas) return;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext: RenderContext = {
        canvasContext: context,
        viewport,
      };
      page.render(renderContext);
    });
  };

  const handleZoomIn = () => {
    setScale((prevScale) => prevScale + 0.1);
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.1));
  };

  const handlePageChange = (event) => {
    const newPageNumber = parseInt(event.target.value, 10);
    if (newPageNumber > 0 && newPageNumber <= numPages) {
      setPageNumber(newPageNumber);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/document.pdf";
    link.download = "document.pdf";
    link.click();
  };

  const toggleThumbnails = () => {
    setShowThumbnails((prevShowThumbnails) => !prevShowThumbnails);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <Button icon={<ZoomInRegular />} onClick={handleZoomIn}>
          Zoom In
        </Button>
        <Button icon={<ZoomOutRegular />} onClick={handleZoomOut}>
          Zoom Out
        </Button>
        <Input
          type="number"
          value={pageNumber}
          onChange={handlePageChange}
          min={1}
          max={numPages}
        />
        <Button icon={<PrintRegular />} onClick={handlePrint}>
          Print
        </Button>
        <Button icon={<ArrowDownloadRegular />} onClick={handleDownload}>
          Download
        </Button>
        <Button icon={<PreviewLinkRegular />} onClick={toggleThumbnails}>
          Toggle Thumbnails
        </Button>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
      {showThumbnails && (
        <div className={styles.thumbnailWrapper}>
          {Array.from(new Array(numPages), (el, index) => (
            <canvas
              key={index}
              className={styles.thumbnail}
              onClick={() => setPageNumber(index + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
