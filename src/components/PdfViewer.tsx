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
  'pdfjs-dist/build/pdf.worker.mjs',
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
    position: "relative",
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
  rectangle: {
    position: "absolute",
    border: "2px solid",
  },
});

const PdfViewer = () => {
  const styles = useStyles();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [rectangles, setRectangles] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentRect, setCurrentRect] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument("/document.pdf");
    loadingTask.promise.then((loadedPdf: PDFDocumentProxy) => {
      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    });

    const storedRectangles = JSON.parse(localStorage.getItem("rectangles") || "[]");
    setRectangles(storedRectangles);
  }, []);

  useEffect(() => {
    if (pdf) {
      renderPage(pageNumber);
    }
  }, [pdf, pageNumber, scale]);

  useEffect(() => {
    const handleScroll = (event) => {
      if (event.deltaY > 0) {
        setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages));
      } else {
        setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
      }
    };

    window.addEventListener("wheel", handleScroll);

    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, [numPages]);

  const handleMouseDown = (event) => {
    if (event.ctrlKey && event.button === 0) {
      setDrawing(true);
      setStartX(event.nativeEvent.offsetX);
      setStartY(event.nativeEvent.offsetY);
      const newRect = {
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        width: 0,
        height: 0,
        color: "red",
      };
      setCurrentRect(newRect);
    }
  };

  const handleMouseMove = (event) => {
    if (drawing) {
      const newRect = {
        ...currentRect,
        width: event.nativeEvent.offsetX - startX,
        height: event.nativeEvent.offsetY - startY,
      };
      setCurrentRect(newRect);
    }
  };

  const handleMouseUp = () => {
    if (drawing) {
      const finalRect = {
        ...currentRect,
        color: "green",
      };
      const newRectangles = [...rectangles, finalRect];
      setRectangles(newRectangles);
      localStorage.setItem("rectangles", JSON.stringify(newRectangles));
      setDrawing(false);
      setCurrentRect(null);
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === "Control" && drawing) {
      handleMouseUp();
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [drawing, currentRect]);

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
      <div
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <canvas />
        {rectangles.map((rect, index) => (
          <div
            key={index}
            className={styles.rectangle}
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderColor: rect.color,
            }}
          />
        ))}
        {currentRect && (
          <div
            className={styles.rectangle}
            style={{
              left: currentRect.x,
              top: currentRect.y,
              width: currentRect.width,
              height: currentRect.height,
              borderColor: currentRect.color,
            }}
          />
        )}
      </div>
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
