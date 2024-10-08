let pdfDoc = null;
let currentScale = 1.5; // Default scale
let searchQuery = ''; // To store the search term

// Load PDF
const loadPDF = (pdfFile) => {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedArray).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            renderAllPages(); // Render the first time with default scale
        });
    };
    fileReader.readAsArrayBuffer(pdfFile);
};

// Render all pages in the PDF
const renderAllPages = () => {
    const pdfContainer = document.querySelector('#pdfContainer');
    pdfContainer.innerHTML = ''; // Clear viewer before rendering new PDF

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        renderPage(pageNum); // Render each page
    }
};

// Render a single page and highlight search results
const renderPage = (pageNum) => {
    pdfDoc.getPage(pageNum).then(function (page) {
        const viewport = page.getViewport({ scale: currentScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        pdfContainer.appendChild(canvas);

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        page.render(renderContext).promise.then(() => {
            if (searchQuery) {
                highlightSearchResults(canvas, page);
            }
        });
    });
};

// Highlight search results
const highlightSearchResults = (canvas, page) => {
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    canvas.parentNode.insertBefore(textLayerDiv, canvas.nextSibling);

    page.getTextContent().then(function (textContent) {
        const textLayer = new pdfjsLib.TextLayerBuilder({
            textLayerDiv: textLayerDiv,
            pageIndex: page.pageNumber,
            viewport: page.getViewport({ scale: currentScale }),
        });
        textLayer.setTextContent(textContent);
        textLayer.render();

        // Search and highlight
        const textItems = textContent.items;
        const regex = new RegExp(searchQuery, 'gi');

        textItems.forEach((item) => {
            if (item.str.match(regex)) {
                const span = document.createElement('span');
                span.textContent = item.str;
                span.style.backgroundColor = 'yellow'; // Highlight color
                textLayerDiv.appendChild(span);
            }
        });
    });
};

// Zoom functionality
const zoomIn = () => {
    currentScale += 0.1; // Increase scale
    renderAllPages();
    updateZoomPercentage();
};

const zoomOut = () => {
    if (currentScale > 0.2) {
        currentScale -= 0.1; // Decrease scale
        renderAllPages();
        updateZoomPercentage();
    }
};

const updateZoomPercentage = () => {
    const zoomPercentage = document.getElementById('zoomPercentage');
    zoomPercentage.textContent = Math.round(currentScale * 100) + '%';
};

// Event Listeners
document.getElementById('uploadPDF').addEventListener('change', (event) => {
    const pdfFile = event.target.files[0];
    if (pdfFile) {
        loadPDF(pdfFile);
    }
});

document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);

// Search functionality
document.getElementById('searchText').addEventListener('input', (event) => {
    searchQuery = event.target.value; // Store the search term
    renderAllPages(); // Re-render to apply search
});

// Chat functionality
const chatMessages = document.getElementById('chatMessages');

document.getElementById('sendButton').addEventListener('click', () => {
    const questionInput = document.getElementById('askQuestion');
    const question = questionInput.value.trim();

    if (question) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `You: ${question}`;
        chatMessages.appendChild(messageDiv);
        questionInput.value = ''; // Clear input field

        // Here you would typically send the question to the server and get a response
        // For now, we'll just echo the question as a placeholder response
        const responseDiv = document.createElement('div');
        responseDiv.textContent = `Bot: This is a placeholder response for "${question}".`;
        chatMessages.appendChild(responseDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    }
});
