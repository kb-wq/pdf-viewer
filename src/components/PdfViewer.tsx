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

  const [rectangles, setRectangles] = useState(() => {
    const savedRectangles = localStorage.getItem("rectangles");
    return savedRectangles ? JSON.parse(savedRectangles) : [];
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Control") {
        setIsDrawing(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control") {
        setIsDrawing(false);
        if (currentRect) {
          setRectangles((prevRectangles) => {
            const newRectangles = [...prevRectangles, currentRect];
            localStorage.setItem("rectangles", JSON.stringify(newRectangles));
            return newRectangles;
          });
          setCurrentRect(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentRect]);

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
      page.render(renderContext).promise.then(() => {
        rectangles.forEach((rect) => {
          context.strokeStyle = "green";
          context.lineWidth = 2;
          context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        });
      });
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
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    let windowContent = '<!DOCTYPE html>';
    windowContent += '<html>';
    windowContent += '<head><title>Print PDF</title></head>';
    windowContent += '<body>';
    windowContent += `<img src="${dataUrl}">`;
    windowContent += '</body>';
    windowContent += '</html>';
    const printWin = window.open('', '', 'width=800,height=600');
    printWin.document.open();
    printWin.document.write(windowContent);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
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

  const handleScroll = (event) => {
    if (event.deltaY > 0) {
      setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages));
    } else {
      setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
    }
  };

  const handleMouseDown = (event) => {
    if (isDrawing && event.button === 0) {
      const rect = {
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        width: 0,
        height: 0,
      };
      setCurrentRect(rect);
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing && currentRect) {
      const newRect = {
        ...currentRect,
        width: event.nativeEvent.offsetX - currentRect.x,
        height: event.nativeEvent.offsetY - currentRect.y,
      };
      setCurrentRect(newRect);
    }
  };

  const handleMouseUp = (event) => {
    if (isDrawing && event.button === 0) {
      setIsDrawing(false);
      if (currentRect) {
        setRectangles((prevRectangles) => {
          const newRectangles = [...prevRectangles, currentRect];
          localStorage.setItem("rectangles", JSON.stringify(newRectangles));
          return newRectangles;
        });
        setCurrentRect(null);
      }
    }
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
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onWheel={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
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
