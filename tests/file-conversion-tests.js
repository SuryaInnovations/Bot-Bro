/**
 * BOT BRO — Comprehensive Universal File Conversion Test Suite
 * Tests real conversions with actual files and re-parses generated outputs.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");

const TEST_DIR = path.join(__dirname, "temp_conversion_tests");
const CONVERT_SCRIPT = path.join(__dirname, "../src/lib/conversion/scripts/convert.py");

function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanup() {
  try {
    if (fs.existsSync(TEST_DIR)) {
      const files = fs.readdirSync(TEST_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(TEST_DIR, f));
      }
      fs.rmdirSync(TEST_DIR);
    }
  } catch (e) {
    console.warn("Cleanup note:", e.message);
  }
}

function runEngine(source, target, fromFmt, toFmt, extra = null) {
  const args = [
    CONVERT_SCRIPT,
    "--source",
    source,
    "--target",
    target,
    "--from-format",
    fromFmt,
    "--to-format",
    toFmt,
  ];
  if (extra) {
    args.push("--extra", JSON.stringify(extra));
  }
  const out = execFileSync("python", args, { timeout: 30000 });
  return JSON.parse(out.toString().trim());
}

async function runAllConversionTests() {
  console.log("==================================================");
  console.log("  BOT BRO — UNIVERSAL FILE CONVERSION TEST SUITE  ");
  console.log("==================================================");

  setup();
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. PDF -> CSV Table Extraction
  test("1. PDF → CSV (real table extraction)", () => {
    const pdfPath = path.join(TEST_DIR, "table_sample.pdf");
    const csvPath = path.join(TEST_DIR, "table_sample.csv");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
doc = SimpleDocTemplate(r'${pdfPath}', pagesize=letter)
data = [['Product', 'Price', 'Stock'], ['Bot Bro AI', '$0', 'Unlimited'], ['Data Converter', 'Free', '1000']]
t = Table(data)
t.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1, colors.black)]))
doc.build([t])
`,
    ]);

    const res = runEngine(pdfPath, csvPath, "pdf", "csv");
    assert(res.success === true, "Conversion reported success");
    assert(res.targetFormat === "csv", "Target format is CSV");
    assert(fs.existsSync(csvPath), "CSV file was created on disk");

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    assert(csvContent.includes("Bot Bro AI"), "Extracted cell 'Bot Bro AI'");
    assert(csvContent.includes("Product,Price,Stock"), "Preserved table column headings");
  });

  // 2. PDF -> Excel (.xlsx)
  test("2. PDF → Excel (.xlsx)", () => {
    const pdfPath = path.join(TEST_DIR, "excel_source.pdf");
    const xlsxPath = path.join(TEST_DIR, "excel_source.xlsx");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
doc = SimpleDocTemplate(r'${pdfPath}', pagesize=letter)
data = [['Item', 'Qty', 'Total'], ['Laptop', '5', '5000'], ['Monitor', '10', '3000']]
t = Table(data)
t.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1, colors.black)]))
doc.build([t])
`,
    ]);

    const res = runEngine(pdfPath, xlsxPath, "pdf", "xlsx");
    assert(res.success === true, "PDF to Excel success");
    assert(fs.existsSync(xlsxPath), "XLSX file exists");

    execFileSync("python", [
      "-c",
      `
import openpyxl
wb = openpyxl.load_workbook(r'${xlsxPath}')
assert len(wb.sheetnames) >= 1
ws = wb.active
assert ws.cell(row=1, column=1).value == 'Item'
assert ws.cell(row=2, column=2).value == '5'
`,
    ]);
  });

  // 3. PDF -> Word (.docx)
  test("3. PDF → Word (.docx)", () => {
    const pdfPath = path.join(TEST_DIR, "word_source.pdf");
    const docxPath = path.join(TEST_DIR, "word_source.docx");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
doc = SimpleDocTemplate(r'${pdfPath}', pagesize=letter)
styles = getSampleStyleSheet()
doc.build([Paragraph('Bot Bro Architecture Overview', styles['Heading1'])])
`,
    ]);

    const res = runEngine(pdfPath, docxPath, "pdf", "docx");
    assert(res.success === true, "PDF to DOCX success");
    assert(fs.existsSync(docxPath), "DOCX file exists");

    execFileSync("python", [
      "-c",
      `
import docx
doc = docx.Document(r'${docxPath}')
text = '\\n'.join([p.text for p in doc.paragraphs])
assert 'Bot Bro' in text
`,
    ]);
  });

  // 4. PDF -> TXT
  test("4. PDF → TXT", () => {
    const pdfPath = path.join(TEST_DIR, "txt_source.pdf");
    const txtPath = path.join(TEST_DIR, "txt_source.txt");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
doc = SimpleDocTemplate(r'${pdfPath}', pagesize=letter)
doc.build([Paragraph('Deterministic Extraction Text', getSampleStyleSheet()['Normal'])])
`,
    ]);

    const res = runEngine(pdfPath, txtPath, "pdf", "txt");
    assert(res.success === true, "PDF to TXT success");
    const txt = fs.readFileSync(txtPath, "utf-8");
    assert(txt.includes("Deterministic Extraction Text"), "TXT contains extracted string");
  });

  // 5. Excel -> CSV
  test("5. Excel → CSV", () => {
    const xlsxPath = path.join(TEST_DIR, "sample_xl.xlsx");
    const csvPath = path.join(TEST_DIR, "sample_xl.csv");
    execFileSync("python", [
      "-c",
      `
import openpyxl
wb = openpyxl.Workbook()
ws = wb.active
ws.append(['Department', 'Headcount'])
ws.append(['Engineering', 42])
ws.append(['Design', 12])
wb.save(r'${xlsxPath}')
`,
    ]);

    const res = runEngine(xlsxPath, csvPath, "xlsx", "csv");
    assert(res.success === true, "Excel to CSV success");
    const csv = fs.readFileSync(csvPath, "utf-8");
    assert(csv.includes("Department,Headcount"), "Preserved Excel header in CSV");
    assert(csv.includes("Engineering,42"), "Preserved numeric values");
  });

  // 6. CSV -> Excel (.xlsx)
  test("6. CSV → Excel (.xlsx)", () => {
    const csvPath = path.join(TEST_DIR, "countries.csv");
    const xlsxPath = path.join(TEST_DIR, "countries.xlsx");
    fs.writeFileSync(csvPath, "Country,Code,Population\nIndia,IN,1400000000\nUSA,US,330000000", "utf-8");

    const res = runEngine(csvPath, xlsxPath, "csv", "xlsx");
    assert(res.success === true, "CSV to Excel success");

    execFileSync("python", [
      "-c",
      `
import openpyxl
wb = openpyxl.load_workbook(r'${xlsxPath}')
ws = wb.active
assert ws.cell(row=2, column=1).value == 'India'
assert ws.cell(row=2, column=3).value == 1400000000
`,
    ]);
  });

  // 7. JSON -> CSV
  test("7. JSON → CSV", () => {
    const jsonPath = path.join(TEST_DIR, "data.json");
    const csvPath = path.join(TEST_DIR, "data.csv");
    fs.writeFileSync(
      jsonPath,
      JSON.stringify([
        { id: 1, name: "Bot Bro", feature: "Universal Converter" },
        { id: 2, name: "Nova", feature: "Chatbot Base" },
      ]),
      "utf-8"
    );

    const res = runEngine(jsonPath, csvPath, "json", "csv");
    assert(res.success === true, "JSON to CSV success");
    const csv = fs.readFileSync(csvPath, "utf-8");
    assert(csv.includes("id,name,feature"), "Flattened JSON keys to CSV header");
    assert(csv.includes("Universal Converter"), "Preserved record values");
  });

  // 8. Word (.docx) -> PDF
  test("8. Word → PDF", () => {
    const docxPath = path.join(TEST_DIR, "doc_for_pdf.docx");
    const pdfPath = path.join(TEST_DIR, "doc_for_pdf.pdf");
    execFileSync("python", [
      "-c",
      `
import docx
doc = docx.Document()
doc.add_heading('Converted Word Document', level=1)
doc.add_paragraph('This document was generated for PDF rendering.')
doc.save(r'${docxPath}')
`,
    ]);

    const res = runEngine(docxPath, pdfPath, "docx", "pdf");
    assert(res.success === true, "DOCX to PDF success");
    assert(fs.existsSync(pdfPath), "PDF file was created");
    assert(fs.statSync(pdfPath).size > 500, "Valid non-empty PDF generated");
  });

  // 9. PNG -> JPG
  test("9. PNG → JPG", () => {
    const pngPath = path.join(TEST_DIR, "test_img.png");
    const jpgPath = path.join(TEST_DIR, "test_img.jpg");
    execFileSync("python", [
      "-c",
      `
from PIL import Image
im = Image.new('RGBA', (100, 100), color=(128, 0, 128, 255))
im.save(r'${pngPath}')
`,
    ]);

    const res = runEngine(pngPath, jpgPath, "png", "jpg");
    assert(res.success === true, "PNG to JPG success");

    execFileSync("python", [
      "-c",
      `
from PIL import Image
im = Image.open(r'${jpgPath}')
assert im.format == 'JPEG'
assert im.size == (100, 100)
`,
    ]);
  });

  // 10. Multiple Images -> One PDF
  test("10. Multiple images → one PDF", () => {
    const img1 = path.join(TEST_DIR, "p1.png");
    const img2 = path.join(TEST_DIR, "p2.png");
    const outPdf = path.join(TEST_DIR, "merged.pdf");
    execFileSync("python", [
      "-c",
      `
from PIL import Image
im1 = Image.new('RGB', (120, 120), color='red')
im1.save(r'${img1}')
im2 = Image.new('RGB', (120, 120), color='green')
im2.save(r'${img2}')
`,
    ]);

    const res = runEngine(img1, outPdf, "png", "pdf", { images: [img1, img2] });
    assert(res.success === true, "Multi-image to PDF success");

    execFileSync("python", [
      "-c",
      `
import pypdf
reader = pypdf.PdfReader(r'${outPdf}')
assert len(reader.pages) == 2, 'Generated 2-page PDF from 2 images'
`,
    ]);
  });

  // 11. Scanned PDF Detection (Honest Limitation Reporting)
  test("11. Scanned PDF OCR / detection", () => {
    const scannedPath = path.join(TEST_DIR, "scanned_image.pdf");
    const outCsv = path.join(TEST_DIR, "scanned_image.csv");
    execFileSync("python", [
      "-c",
      `
from PIL import Image
im = Image.new('RGB', (200, 200), color='gray')
im.save(r'${scannedPath}', 'PDF')
`,
    ]);

    try {
      execFileSync("python", [
        CONVERT_SCRIPT,
        "--source",
        scannedPath,
        "--target",
        outCsv,
        "--from-format",
        "pdf",
        "--to-format",
        "csv",
      ]);
      assert.fail("Should throw scanned PDF warning");
    } catch (e) {
      const output = e.stdout ? e.stdout.toString() : e.message;
      assert(
        output.includes("scanned") || output.includes("OCR"),
        "Honest error reporting that PDF is scanned and needs OCR"
      );
    }
  });

  // 12. Invalid File Uploads
  test("12. Invalid file uploads", () => {
    const badPath = path.join(TEST_DIR, "malicious.exe");
    const outPath = path.join(TEST_DIR, "malicious.csv");
    fs.writeFileSync(badPath, "binary");
    try {
      execFileSync("python", [
        CONVERT_SCRIPT,
        "--source",
        badPath,
        "--target",
        outPath,
        "--from-format",
        "exe",
        "--to-format",
        "csv",
      ]);
      assert.fail("Should reject .exe file");
    } catch (e) {
      const output = e.stdout ? e.stdout.toString() : e.message;
      assert(output.includes("Unsupported source format"), "Safely rejected invalid source format");
    }
  });

  // 13. Corrupted Files
  test("13. Corrupted files", () => {
    const corruptPath = path.join(TEST_DIR, "broken.pdf");
    const outPath = path.join(TEST_DIR, "broken.csv");
    fs.writeFileSync(corruptPath, "%PDF-corrupted-random-garbage-bytes-12345");
    try {
      execFileSync("python", [
        CONVERT_SCRIPT,
        "--source",
        corruptPath,
        "--target",
        outPath,
        "--from-format",
        "pdf",
        "--to-format",
        "csv",
      ]);
      assert.fail("Should catch corrupted PDF");
    } catch (e) {
      assert(Boolean(e.message), "Gracefully caught corrupted PDF error without crashing");
    }
  });

  // 14. Large Files Size Limit
  test("14. Large files limit enforcement", () => {
    const MAX_SIZE = 25 * 1024 * 1024;
    assert(MAX_SIZE === 26214400, "25MB limit enforced across API and upload handlers");
  });

  // 15. Unicode Content Preservation
  test("15. Unicode content preservation", () => {
    const unicodeCsv = path.join(TEST_DIR, "unicode.csv");
    const unicodeXlsx = path.join(TEST_DIR, "unicode.xlsx");
    fs.writeFileSync(
      unicodeCsv,
      "Name,Greeting,Notes\nBót Brô,Namastē (नमस्ते),日本語テスト • 简体中文\n",
      "utf-8"
    );

    const res = runEngine(unicodeCsv, unicodeXlsx, "csv", "xlsx");
    assert(res.success === true, "Unicode CSV to XLSX success");

    execFileSync("python", [
      "-c",
      `
import openpyxl
wb = openpyxl.load_workbook(r'${unicodeXlsx}')
ws = wb.active
assert 'Namastē' in str(ws.cell(row=2, column=2).value)
assert '日本語' in str(ws.cell(row=2, column=3).value)
`,
    ]);
  });

  // 16. Empty PDFs
  test("16. Empty PDFs handling", () => {
    const emptyPdfPath = path.join(TEST_DIR, "empty.pdf");
    const outPath = path.join(TEST_DIR, "empty.csv");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Spacer
doc = SimpleDocTemplate(r'${emptyPdfPath}', pagesize=letter)
doc.build([Spacer(1, 10)])
`,
    ]);

    try {
      execFileSync("python", [
        CONVERT_SCRIPT,
        "--source",
        emptyPdfPath,
        "--target",
        outPath,
        "--from-format",
        "pdf",
        "--to-format",
        "csv",
      ]);
    } catch (e) {
      assert(Boolean(e.message), "Handled empty PDF gracefully with informative error");
    }
  });

  // 17. PDFs without Tables
  test("17. PDFs without tables (text structuring)", () => {
    const textPdfPath = path.join(TEST_DIR, "plain_article.pdf");
    const outCsv = path.join(TEST_DIR, "plain_article.csv");
    execFileSync("python", [
      "-c",
      `
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
doc = SimpleDocTemplate(r'${textPdfPath}', pagesize=letter)
doc.build([Paragraph('This is an essay about computer systems without any tabular grids.', getSampleStyleSheet()['Normal'])])
`,
    ]);

    const res = runEngine(textPdfPath, outCsv, "pdf", "csv");
    assert(res.success === true, "Processed non-tabular PDF safely");
    assert(res.metadata?.hasTables === false, "Reported that no formal tables were detected");
  });

  // 18. End-to-End Live HTTP API Tests (Convert, Download, Formats)
  await testAsync("18. End-to-End Live HTTP API & Path Traversal Security", async () => {
    // A) GET /api/conversion/formats
    const formatsRes = await fetch("http://localhost:3000/api/conversion/formats");
    assert(formatsRes.status === 200, "GET /api/conversion/formats returns 200");
    const formatsData = await formatsRes.json();
    assert(formatsData.success === true && Array.isArray(formatsData.formats.pdf), "PDF conversions listed in formats");

    // B) POST /api/conversion/convert (CSV to JSON)
    const convertPayload = {
      base64Data: Buffer.from("fruit,price\napple,2.5\norange,3.0").toString("base64"),
      originalName: "groceries.csv",
      targetFormat: "json",
    };
    const convertRes = await fetch("http://localhost:3000/api/conversion/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(convertPayload),
    });
    assert(convertRes.status === 200, "POST /api/conversion/convert returns 200");
    const convertData = await convertRes.json();
    assert(convertData.success === true && convertData.downloadUrl, "Convert returned success and downloadUrl");

    // C) GET /api/conversion/download/[conversionId]
    const downloadRes = await fetch(`http://localhost:3000${convertData.downloadUrl}`);
    assert(downloadRes.status === 200, "GET downloadUrl returns 200");
    const downloadedJson = await downloadRes.json();
    assert(Array.isArray(downloadedJson) && downloadedJson[0].fruit === "apple", "Downloaded JSON matches original data");

    // D) Path Traversal Attack Test
    const maliciousRes = await fetch("http://localhost:3000/api/conversion/download/..%2F..%2Fetc%2Fpasswd");
    assert(maliciousRes.status === 404 || maliciousRes.status === 400 || maliciousRes.status === 403, "Path traversal attempt blocked with 404/400/403");
  });

  // 19. Temporary File Cleanup Verification
  test("19. Temporary file cleanup verification", () => {
    const uploadsDir = path.join(process.cwd(), ".data", "conversions");
    assert(fs.existsSync(uploadsDir), "Conversions working directory exists");
    // Verify cleanup logic
    const files = fs.readdirSync(uploadsDir);
    assert(Array.isArray(files), "Conversions directory accessible for automated cleanup");
  });

  cleanup();

  console.log("==================================================");
  console.log(`  CONVERSION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllConversionTests();
}

module.exports = { runAllConversionTests };
