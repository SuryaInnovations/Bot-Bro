# BOT BRO — Universal File Conversion Engine Report

*Document generated on: October 30, 2026*  
*Project: BOT BRO Intelligent AI Assistant*  
*Status: Production Ready — 19/19 Integration Tests Passed*

---

## 1. Executive Summary

A real, server-side, deterministic **Universal File Conversion Engine** has been implemented for BOT BRO. Users can upload documents, spreadsheets, images, and data files via the attachment button or drag-and-drop, and convert them across 10 major format families either via the interactive chat interface (e.g., *"Convert this PDF to CSV"*, *"Convert this Excel file to PDF"*) or through REST API endpoints.

All conversions execute using verified server-side libraries (`pdfplumber`, `openpyxl`, `python-docx`, `reportlab`, `Pillow`, `SheetJS / xlsx`, and `mammoth`), with **zero reliance on paid or rate-limited third-party APIs**. Extracted tables preserve original column headings, numeric types, and Unicode characters without content hallucination.

---

## 2. Supported Conversion Matrix

| Source Format | Genuinely Supported Output Formats | Primary Engine / Library | Special Capabilities |
| :--- | :--- | :--- | :--- |
| **PDF (`.pdf`)** | **CSV**, **Excel (`.xlsx`)**, **Word (`.docx`)**, **TXT**, **Markdown (`.md`)**, **PNG**, **JPG** | `pdfplumber`, `openpyxl`, `python-docx` | • Multi-page table detection<br>• Header & number preservation<br>• Empty cell normalization<br>• Scanned raster PDF detection |
| **Excel (`.xlsx`, `.xls`)** | **CSV**, **PDF**, **JSON**, **HTML** | `openpyxl`, `reportlab`, `xlsx` | • Multi-sheet selection<br>• Styled PDF table rendering<br>• Structured JSON records |
| **CSV (`.csv`)** | **Excel (`.xlsx`)**, **JSON**, **PDF**, **HTML** | `openpyxl`, `reportlab`, Python `csv` | • Column header auto-styling<br>• Alternating zebra rows in PDF<br>• Numeric type casting |
| **Word (`.docx`)** | **PDF**, **TXT**, **HTML**, **Markdown** | `python-docx`, `reportlab`, `mammoth` | • Paragraph & heading hierarchy<br>• Embedded table preservation |
| **Images (`.png`, `.jpg`, `.jpeg`, `.webp`)** | **JPG**, **PNG**, **PDF (single)**, **PDF (multi-image)** | `Pillow (PIL)`, `reportlab` | • RGBA to RGB alpha compositing<br>• High-quality JPEG compression<br>• Multi-image merge to 1 PDF |
| **Text (`.txt`)** | **PDF**, **Word (`.docx`)** | `reportlab`, `python-docx` | • Paginated layout with margins<br>• Clean typography & line wraps |
| **JSON (`.json`)** | **CSV**, **Excel (`.xlsx`)**, **PDF** | Python `json`, `openpyxl`, `reportlab` | • Flat array-of-objects extraction<br>• Preformatted PDF code report |
| **Markdown (`.md`)** | **PDF**, **HTML** | `reportlab`, Python regex | • Markdown headings & bullet lists<br>• Clean standalone HTML document |
| **HTML (`.html`)** | **PDF** | `reportlab` | • Clean layout and typography |

---

## 3. PDF to CSV Table Extraction Architecture

The high-priority **PDF to CSV** feature was implemented with specific attention to structural accuracy:

1. **Table Detection & Page Scanning**:
   - `pdfplumber` analyzes horizontal and vertical ruling lines across all document pages.
   - Extracts rows and cells while maintaining column index alignment.
2. **Cell Value Normalization**:
   - Internal line wraps (`\r`, `\n`) within cells are collapsed into single spaces.
   - Empty or missing cells default to valid empty CSV tokens (`""`) rather than shifting adjacent columns.
   - Leading/trailing whitespace is stripped.
3. **Scanned PDF Handling & OCR Notice**:
   - The engine tallies selectable characters across all pages. If total character count is zero and no vector lines exist, it accurately identifies the document as an image-only raster scan and reports:
     > *"This PDF appears to be a scanned image or contains no selectable text. OCR is required to extract text from scanned documents."*
   - It **never fabricates or returns empty dummy rows**.
4. **Non-Tabular PDF Fallback**:
   - If a text PDF contains no formal table grids, Bot Bro structures the extracted text lines into clean CSV rows and informs the user.

---

## 4. API Endpoints Implemented

1. **`POST /api/conversion/convert`**
   - Accepts `multipart/form-data` with `file`, `targetFormat`, and optional `options`.
   - Also accepts `application/json` with `base64Data`, `originalName`, and `targetFormat`.
   - Enforces a strict **25MB file upload limit**.
   - Validates file extensions and MIME types.
   - Returns conversion metadata, output size, preview snippet, and direct download URL.

2. **`GET /api/conversion/download/[conversionId]`**
   - Serves the generated file with `Content-Disposition: attachment; filename="<safe_name>.<ext>"`.
   - Sets appropriate `Content-Type` (e.g. `text/csv; charset=utf-8`, `application/pdf`, etc.).
   - Implements **path traversal prevention**: verifies that the resolved path is strictly confined within `.data/conversions/`.

3. **`GET /api/conversion/formats`**
   - Returns the active matrix of supported input formats and their compatible target conversions.

---

## 5. Chat Interface Integration

- **Natural Language Triggering**:
  - Automatically identifies conversion intent from prompts like:
    - *"Convert this PDF to CSV"*
    - *"Extract tables from this document into Excel"*
    - *"Convert this Word document to PDF"*
    - *"Turn these images into a PDF"*
- **Quick Action Chips in Composer**:
  - Attaching any supported file automatically surfaces quick-convert action chips (e.g., `Extract Tables to CSV`, `To Excel (.xlsx)`, `To Word (.docx)`).
- **Download Experience in Messages**:
  - The chat response outputs a structured summary showing the original filename, target format, file size, table/row count, preview snippet, and a styled **[Download File]** button.

---

## 6. Security & Privacy Audit

- **Input Sanitization**: Filenames are sanitized with regex (`/[^a-zA-Z0-9_\-\.]/g`) to prevent shell injection or filename spoofing.
- **Path Traversal Protection**: Conversion IDs are generated as unguessable tokens (`conv-<timestamp>-<hex>`). Direct directory navigation attempts (e.g., `../../etc/passwd`) are blocked with HTTP 404/403.
- **Isolated Storage**: Uploaded files and generated conversions reside in `.data/conversions/` and are not publicly browsable as static assets.
- **Lifecycle Cleanup**: Implemented `ConversionManager.cleanupOldFiles()` to purge temporary files older than 24 hours.

---

## 7. Automated Test Verification

A dedicated 19-case test suite (`tests/file-conversion-tests.js`) was executed with real sample files:

| # | Test Case | Target / Method | Result |
| :---: | :--- | :--- | :---: |
| 1 | PDF → CSV | Real ReportLab table generated, extracted via `pdfplumber`, re-parsed | **PASS** |
| 2 | PDF → Excel | Extracted into `.xlsx`, re-opened with `openpyxl` | **PASS** |
| 3 | PDF → Word | Extracted into `.docx`, verified paragraphs with `python-docx` | **PASS** |
| 4 | PDF → TXT | Extracted layout text verified with character count checks | **PASS** |
| 5 | Excel → CSV | Created `.xlsx` with numeric data, converted and verified headers | **PASS** |
| 6 | CSV → Excel | Converted CSV to `.xlsx`, checked cells with `openpyxl` | **PASS** |
| 7 | JSON → CSV | Flattened JSON array, verified headers and record values | **PASS** |
| 8 | Word → PDF | Created `.docx`, rendered into ReportLab PDF, checked byte size | **PASS** |
| 9 | PNG → JPG | RGBA image composited on white background, verified JPEG format | **PASS** |
| 10 | Multiple Images → PDF | Two distinct images combined into a 2-page PDF, checked page count | **PASS** |
| 11 | Scanned PDF OCR Detection | Image-only PDF fed to engine; verified honest OCR requirement alert | **PASS** |
| 12 | Invalid File Uploads | `.exe` file rejected with explicit format error | **PASS** |
| 13 | Corrupted Files | Corrupted byte header caught gracefully without server crash | **PASS** |
| 14 | Large Files Limit | 25MB boundary enforced | **PASS** |
| 15 | Unicode Content | Devanagari (`नमस्ते`), Japanese (`日本語`), and accents preserved in Excel | **PASS** |
| 16 | Empty PDFs | Blank page PDF handled gracefully with user notice | **PASS** |
| 17 | PDFs without Tables | Plain article structured into rows with `hasTables: false` flag | **PASS** |
| 18 | Live HTTP API End-to-End | Tested `/api/conversion/convert` and `/api/conversion/download/[id]` | **PASS** |
| 19 | Temporary File Cleanup | Purged expired files without touching active records | **PASS** |

**Summary**: **19 PASSED, 0 FAILED**.
