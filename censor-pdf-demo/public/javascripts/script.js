// https://github.com/naptha/tesseract.js
const createWorker = Tesseract;
// https://github.com/mozilla/pdf.js
var pdfjsLib = window["pdfjs-dist/build/pdf"];

const output = document.getElementById("output");
if (window.FileList && window.File) {
    document
        .getElementById("file-selector")
        .addEventListener("change", (event) => {
            output.innerHTML = "";
            const file = event.target.files[0];
            const li = document.createElement("li");
            const name = file.name ? file.name : "NOT SUPPORTED";
            const type = file.type ? file.type : "NOT SUPPORTED";
            const size = file.size ? file.size : "NOT SUPPORTED";
            li.textContent = `name: ${name}, type: ${type}, size: ${size}`;
            output.appendChild(li);
            if (file.type.indexOf("image") !== -1) {
                runOCR(file);
            }
            if (file.type.indexOf("pdf") !== -1) {
                console.log("pdf", file);

                var reader = new FileReader();

                reader.onload = function () {
                    console.log(reader.result);
                    pdfToImage(reader.result);
                };

                reader.readAsBinaryString(file);
            }
        });
}

function runOCR(url) {
    createWorker
        .recognize(url)
        .then(function (result) {
            console.log("result", result);
            document.getElementById("ocr_results").innerText = result.text;
            if (result.words) {
                const canvas = cloneCanvas(document.getElementById("the-canvas"));
                result.words.forEach((wordData) => {
                    console.log("wordData", wordData);
                    drawRectangle(canvas, wordData.bbox);
                });
            }
        })
        .progress(function (result) {
            console.log(result);
            document.getElementById("ocr_status").innerText =
                result["status"] + " (" + result["progress"] * 100 + "%)";
        });
}

function drawRectangle(canvas, bbox) {
    var context = canvas.getContext("2d");
    context.beginPath();
    context.rect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
    // context.rect(20, 20, 150, 100);
    context.fill();
    context.stroke();
}

function cloneCanvas(oldCanvas) {
    //create a new canvas
    var newCanvas = document.getElementById("the-canvas2");
    var context = newCanvas.getContext("2d");

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
}

function pdfToImage(pdfBinary) {
    // Asynchronous download of PDF
    var loadingTask = pdfjsLib.getDocument({ data: pdfBinary });
    loadingTask.promise.then(
        function (pdf) {
            console.log("PDF loaded");

            // Fetch the first page
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function (page) {
                console.log("Page loaded");

                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                var canvas = document.getElementById("the-canvas");
                var context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log("Page rendered");
                    runOCR(document.getElementById("the-canvas"));
                });
            });
        },
        function (reason) {
            // PDF loading error
            console.error(reason);
        }
    );
}