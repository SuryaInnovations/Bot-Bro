#!/usr/bin/env python3
"""
BOT BRO — Universal File Conversion Engine
Deterministic, server-side document, spreadsheet, data, and image converter.
Handles:
  - PDF -> CSV, XLSX, DOCX, TXT, MD, PNG, JPG
  - Excel -> CSV, PDF, JSON, HTML
  - CSV -> XLSX, JSON, PDF, HTML
  - Word (DOCX) -> PDF, TXT, HTML, MD
  - Images -> JPG, PNG, PDF, Multi-Image PDF
  - Text/Data -> PDF, DOCX, CSV, XLSX, HTML
"""

import sys
import os
import json
import csv
import argparse
import re
from typing import List, Dict, Any, Optional

# Supported Libraries Check
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    openpyxl = None

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
except ImportError:
    docx = None

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, PageBreak
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    SimpleDocTemplate = None


def normalize_cell_value(val: Any) -> str:
    """Normalize cell values for clean table representation"""
    if val is None:
        return ""
    val_str = str(val).strip()
    # Collapse multiple internal whitespace/newlines
    val_str = re.sub(r'[\r\n]+', ' ', val_str)
    val_str = re.sub(r'\s{2,}', ' ', val_str)
    return val_str


# ============================================================================
# 1. PDF CONVERSIONS
# ============================================================================

def convert_pdf_to_csv(input_path: str, output_path: str) -> Dict[str, Any]:
    """Extract tables from PDF and write to valid RFC-4180 CSV"""
    if not pdfplumber:
        raise RuntimeError("pdfplumber library is required for PDF table extraction.")

    extracted_tables = []
    total_pages = 0
    total_chars = 0

    with pdfplumber.open(input_path) as pdf:
        total_pages = len(pdf.pages)
        for page_idx, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            total_chars += len(text)
            tables = page.extract_tables()
            if tables:
                for t_idx, tbl in enumerate(tables, 1):
                    cleaned_table = []
                    for row in tbl:
                        cleaned_row = [normalize_cell_value(c) for c in row]
                        # Discard completely empty rows
                        if any(cleaned_row):
                            cleaned_table.append(cleaned_row)
                    if cleaned_table:
                        extracted_tables.append({
                            "page": page_idx,
                            "table_index": t_idx,
                            "rows": cleaned_table
                        })

    # Detect Scanned PDF without selectable text
    if total_chars == 0 and len(extracted_tables) == 0:
        return {
            "success": False,
            "isScanned": True,
            "error": "This PDF appears to be a scanned image or contains no selectable text. OCR is required to extract text from scanned documents.",
            "pages": total_pages,
            "tablesCount": 0,
            "rowsCount": 0
        }

    # If no tables were detected, offer structured text extraction as CSV lines
    if not extracted_tables:
        lines_extracted = []
        with pdfplumber.open(input_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                for line in text.split("\n"):
                    clean_line = line.strip()
                    if clean_line:
                        # Attempt comma / tab / space separation
                        if "\t" in clean_line:
                            lines_extracted.append([c.strip() for c in clean_line.split("\t")])
                        elif "," in clean_line:
                            lines_extracted.append([c.strip() for c in clean_line.split(",")])
                        else:
                            lines_extracted.append([clean_line])

        if lines_extracted:
            with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
                writer.writerow(["Extracted Content (No formal table borders detected)"])
                for row in lines_extracted:
                    writer.writerow(row)

            return {
                "success": True,
                "hasTables": False,
                "isScanned": False,
                "pages": total_pages,
                "tablesCount": 0,
                "rowsCount": len(lines_extracted),
                "message": "No bordered tables were found. Text lines have been structured into CSV rows.",
                "preview": "\n".join([",".join(r) for r in lines_extracted[:10]])
            }
        else:
            return {
                "success": False,
                "hasTables": False,
                "isScanned": False,
                "error": "No tables or text could be extracted from this PDF.",
                "pages": total_pages
            }

    # Tables detected: Write out to clean CSV
    total_rows = 0
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        for idx, table_info in enumerate(extracted_tables):
            # If multiple tables, add a clear section separator
            if len(extracted_tables) > 1:
                if idx > 0:
                    writer.writerow([])
                writer.writerow([f"# --- Table {idx+1} (Page {table_info['page']}) ---"])

            for row in table_info["rows"]:
                writer.writerow(row)
                total_rows += 1

    # Read preview lines
    preview_lines = []
    with open(output_path, "r", encoding="utf-8-sig") as f:
        for _ in range(12):
            line = f.readline()
            if not line:
                break
            preview_lines.append(line.strip())

    return {
        "success": True,
        "hasTables": True,
        "isScanned": False,
        "pages": total_pages,
        "tablesCount": len(extracted_tables),
        "rowsCount": total_rows,
        "preview": "\n".join(preview_lines)
    }


def convert_pdf_to_xlsx(input_path: str, output_path: str) -> Dict[str, Any]:
    """Extract tables from PDF into formatted Excel (.xlsx) workbook"""
    if not pdfplumber or not openpyxl:
        raise RuntimeError("pdfplumber and openpyxl are required for PDF to Excel conversion.")

    wb = openpyxl.Workbook()
    default_sheet = wb.active
    wb.remove(default_sheet)

    table_count = 0
    total_rows = 0

    with pdfplumber.open(input_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            for t_idx, tbl in enumerate(tables, 1):
                cleaned_table = []
                for row in tbl:
                    cleaned_row = [normalize_cell_value(c) for c in row]
                    if any(cleaned_row):
                        cleaned_table.append(cleaned_row)

                if cleaned_table:
                    table_count += 1
                    sheet_title = f"Page {page_idx} Table {t_idx}"[:31]
                    ws = wb.create_sheet(title=sheet_title)

                    # Header style
                    header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
                    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
                    thin_border = Border(
                        left=Side(style="thin", color="D1D5DB"),
                        right=Side(style="thin", color="D1D5DB"),
                        top=Side(style="thin", color="D1D5DB"),
                        bottom=Side(style="thin", color="D1D5DB")
                    )

                    for r_idx, row in enumerate(cleaned_table, 1):
                        total_rows += 1
                        for c_idx, cell_value in enumerate(row, 1):
                            cell = ws.cell(row=r_idx, column=c_idx, value=cell_value)
                            cell.border = thin_border
                            if r_idx == 1:
                                cell.fill = header_fill
                                cell.font = header_font
                                cell.alignment = Alignment(horizontal="center", vertical="center")
                            else:
                                cell.font = Font(name="Calibri", size=10)
                                cell.alignment = Alignment(vertical="center")

                    # Auto column widths
                    for col in ws.columns:
                        max_len = max(len(str(cell.value or '')) for cell in col)
                        col_letter = get_column_letter(col[0].column)
                        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 45)

    if table_count == 0:
        # Fallback to single text sheet
        ws = wb.create_sheet(title="Extracted Content")
        with pdfplumber.open(input_path) as pdf:
            row_idx = 1
            for page in pdf.pages:
                text = page.extract_text() or ""
                for line in text.split("\n"):
                    if line.strip():
                        ws.cell(row=row_idx, column=1, value=line.strip())
                        row_idx += 1

    wb.save(output_path)
    return {
        "success": True,
        "tablesCount": table_count,
        "rowsCount": total_rows
    }


def convert_pdf_to_docx(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert PDF text and tables into structured Microsoft Word (.docx) document"""
    if not pdfplumber or not docx:
        raise RuntimeError("pdfplumber and python-docx are required for PDF to Word conversion.")

    doc = docx.Document()
    total_paragraphs = 0
    total_tables = 0

    with pdfplumber.open(input_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, 1):
            if page_idx > 1:
                doc.add_page_break()

            doc.add_heading(f"Page {page_idx}", level=2)

            tables = page.extract_tables()
            if tables:
                for tbl in tables:
                    cleaned_rows = [[normalize_cell_value(c) for c in r] for r in tbl if any(r)]
                    if cleaned_rows and len(cleaned_rows[0]) > 0:
                        word_tbl = doc.add_table(rows=len(cleaned_rows), cols=len(cleaned_rows[0]))
                        word_tbl.style = "Table Grid"
                        for r_i, row_data in enumerate(cleaned_rows):
                            for c_i, val in enumerate(row_data):
                                if c_i < len(word_tbl.columns):
                                    cell = word_tbl.cell(r_i, c_i)
                                    cell.text = val
                                    if r_i == 0:
                                        for p in cell.paragraphs:
                                            for run in p.runs:
                                                run.font.bold = True
                        total_tables += 1
                        doc.add_paragraph()

            # Also add non-tabular paragraphs
            text = page.extract_text() or ""
            for line in text.split("\n"):
                if line.strip():
                    doc.add_paragraph(line.strip())
                    total_paragraphs += 1

    doc.save(output_path)
    return {
        "success": True,
        "paragraphs": total_paragraphs,
        "tables": total_tables
    }


def convert_pdf_to_txt(input_path: str, output_path: str) -> Dict[str, Any]:
    """Extract all text from PDF preserving layout"""
    if not pdfplumber:
        raise RuntimeError("pdfplumber is required for PDF text extraction.")

    text_pages = []
    with pdfplumber.open(input_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text(layout=True) or page.extract_text() or ""
            text_pages.append(f"--- Page {page_idx} ---\n{page_text}")

    full_text = "\n\n".join(text_pages)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    return {
        "success": True,
        "characters": len(full_text),
        "pages": len(text_pages)
    }


def convert_pdf_to_md(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert PDF into GitHub Flavored Markdown with markdown tables"""
    if not pdfplumber:
        raise RuntimeError("pdfplumber is required for PDF to Markdown.")

    md_lines = []
    with pdfplumber.open(input_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, 1):
            md_lines.append(f"## Page {page_idx}\n")

            tables = page.extract_tables()
            if tables:
                for tbl in tables:
                    cleaned = [[normalize_cell_value(c) for c in r] for r in tbl if any(r)]
                    if cleaned and len(cleaned[0]) > 0:
                        header = cleaned[0]
                        md_lines.append("| " + " | ".join(header) + " |")
                        md_lines.append("| " + " | ".join(["---"] * len(header)) + " |")
                        for row in cleaned[1:]:
                            # Pad row if columns missing
                            padded_row = row + [""] * (len(header) - len(row))
                            md_lines.append("| " + " | ".join(padded_row[:len(header)]) + " |")
                        md_lines.append("\n")

            text = page.extract_text() or ""
            for line in text.split("\n"):
                if line.strip():
                    md_lines.append(line.strip() + "\n")
            md_lines.append("\n---\n")

    full_md = "\n".join(md_lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_md)

    return {
        "success": True,
        "length": len(full_md)
    }


def convert_pdf_to_images(input_path: str, output_dir: str, target_format: str = "png") -> Dict[str, Any]:
    """Convert PDF pages to PNG/JPG image files"""
    if not pdfplumber:
        raise RuntimeError("pdfplumber is required for PDF to image rendering.")

    image_paths = []
    fmt = target_format.lower()
    if fmt not in ["png", "jpg", "jpeg"]:
        fmt = "png"

    with pdfplumber.open(input_path) as pdf:
        for idx, page in enumerate(pdf.pages, 1):
            img_obj = page.to_image(resolution=150)
            img_name = f"page_{idx}.{fmt}"
            out_img_path = os.path.join(output_dir, img_name)
            img_obj.save(out_img_path, format="PNG" if fmt == "png" else "JPEG")
            image_paths.append(out_img_path)

    return {
        "success": True,
        "images": image_paths,
        "count": len(image_paths)
    }


# ============================================================================
# 2. EXCEL CONVERSIONS
# ============================================================================

def convert_excel_to_csv(input_path: str, output_path: str, sheet_name: Optional[str] = None) -> Dict[str, Any]:
    """Convert Excel worksheet(s) to CSV"""
    if not openpyxl:
        raise RuntimeError("openpyxl is required for Excel reading.")

    wb = openpyxl.load_workbook(input_path, data_only=True)
    target_sheet = wb[sheet_name] if sheet_name and sheet_name in wb.sheetnames else wb.active

    rows_written = 0
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        for row in target_sheet.iter_rows(values_only=True):
            clean_row = [normalize_cell_value(c) for c in row]
            if any(clean_row):
                writer.writerow(clean_row)
                rows_written += 1

    return {
        "success": True,
        "sheet": target_sheet.title,
        "rows": rows_written
    }


def convert_excel_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Render Excel spreadsheet as a styled PDF document using ReportLab"""
    if not openpyxl or not SimpleDocTemplate:
        raise RuntimeError("openpyxl and reportlab are required for Excel to PDF.")

    wb = openpyxl.load_workbook(input_path, data_only=True)
    sheet = wb.active

    data = []
    for row in sheet.iter_rows(values_only=True):
        clean_row = [normalize_cell_value(c) for c in row]
        if any(clean_row):
            data.append(clean_row)

    if not data:
        data = [["Empty Spreadsheet"]]

    # Normalize column lengths
    max_cols = max(len(r) for r in data)
    norm_data = [r + [""] * (max_cols - len(r)) for r in data]

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    elements = [
        Paragraph(f"<b>Excel Export: {sheet.title}</b>", styles["Heading2"]),
        Spacer(1, 12)
    ]

    t = Table(norm_data, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elements.append(t)
    doc.build(elements)

    return {
        "success": True,
        "rows": len(norm_data),
        "cols": max_cols
    }


def convert_excel_to_json(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Excel spreadsheet rows to array of JSON objects"""
    if not openpyxl:
        raise RuntimeError("openpyxl is required for Excel to JSON.")

    wb = openpyxl.load_workbook(input_path, data_only=True)
    sheet = wb.active

    rows = []
    for row in sheet.iter_rows(values_only=True):
        clean_row = [normalize_cell_value(c) for c in row]
        if any(clean_row):
            rows.append(clean_row)

    if not rows:
        records = []
    else:
        headers = rows[0]
        records = []
        for r in rows[1:]:
            record = {}
            for idx, h in enumerate(headers):
                val = r[idx] if idx < len(r) else ""
                record[h or f"Column_{idx+1}"] = val
            records.append(record)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    return {
        "success": True,
        "records": len(records)
    }


def convert_excel_to_html(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Excel worksheet into a responsive styled HTML table"""
    if not openpyxl:
        raise RuntimeError("openpyxl is required for Excel to HTML.")

    wb = openpyxl.load_workbook(input_path, data_only=True)
    sheet = wb.active

    html_parts = [
        "<!DOCTYPE html>",
        "<html><head><meta charset='utf-8'><title>Excel Export</title>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f9fafb; color: #111827; }",
        "table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; margin-top: 16px; }",
        "th { background: #1f2937; color: #fff; font-weight: 600; text-align: left; padding: 12px 16px; font-size: 13px; }",
        "td { padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }",
        "tr:nth-child(even) { background: #f9fafb; }",
        "tr:hover { background: #f3f4f6; }",
        "</style></head><body>",
        f"<h2>Spreadsheet: {sheet.title}</h2>",
        "<table>"
    ]

    is_header = True
    for row in sheet.iter_rows(values_only=True):
        clean_row = [normalize_cell_value(c) for c in row]
        if any(clean_row):
            html_parts.append("<tr>")
            for c in clean_row:
                if is_header:
                    html_parts.append(f"<th>{c}</th>")
                else:
                    html_parts.append(f"<td>{c}</td>")
            html_parts.append("</tr>")
            is_header = False

    html_parts.append("</table></body></html>")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    return {"success": True}


# ============================================================================
# 3. CSV CONVERSIONS
# ============================================================================

def convert_csv_to_xlsx(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert CSV file into an Excel (.xlsx) workbook with styled header"""
    if not openpyxl:
        raise RuntimeError("openpyxl is required for CSV to Excel.")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"

    header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style="thin", color="D1D5DB"),
        right=Side(style="thin", color="D1D5DB"),
        top=Side(style="thin", color="D1D5DB"),
        bottom=Side(style="thin", color="D1D5DB")
    )

    rows_count = 0
    with open(input_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for r_idx, row in enumerate(reader, 1):
            rows_count += 1
            for c_idx, val in enumerate(row, 1):
                # Try parsing numeric values
                cell_val = val
                if re.match(r'^-?\d+(\.\d+)?$', val.strip()):
                    try:
                        cell_val = float(val) if '.' in val else int(val)
                    except:
                        pass
                cell = ws.cell(row=r_idx, column=c_idx, value=cell_val)
                cell.border = thin_border
                if r_idx == 1:
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    cell.font = Font(name="Calibri", size=10)

    # Column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 45)

    wb.save(output_path)
    return {
        "success": True,
        "rows": rows_count
    }


def convert_csv_to_json(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert CSV to JSON array of objects"""
    records = []
    with open(input_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append(dict(r))

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    return {
        "success": True,
        "records": len(records)
    }


def convert_csv_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert CSV file to formatted PDF table"""
    if not SimpleDocTemplate:
        raise RuntimeError("reportlab is required for CSV to PDF.")

    data = []
    with open(input_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for r in reader:
            if any(r):
                data.append([normalize_cell_value(c) for c in r])

    if not data:
        data = [["Empty CSV File"]]

    max_cols = max(len(r) for r in data)
    norm_data = [r + [""] * (max_cols - len(r)) for r in data]

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    elements = [
        Paragraph("<b>CSV Document Export</b>", styles["Heading2"]),
        Spacer(1, 12)
    ]

    t = Table(norm_data, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elements.append(t)
    doc.build(elements)

    return {
        "success": True,
        "rows": len(norm_data)
    }


def convert_csv_to_html(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert CSV file to styled HTML table"""
    html_parts = [
        "<!DOCTYPE html>",
        "<html><head><meta charset='utf-8'><title>CSV Export</title>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f9fafb; color: #111827; }",
        "table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; margin-top: 16px; }",
        "th { background: #1f2937; color: #fff; font-weight: 600; text-align: left; padding: 12px 16px; font-size: 13px; }",
        "td { padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }",
        "tr:nth-child(even) { background: #f9fafb; }",
        "tr:hover { background: #f3f4f6; }",
        "</style></head><body>",
        "<h2>CSV Data View</h2>",
        "<table>"
    ]

    is_header = True
    with open(input_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            if any(row):
                html_parts.append("<tr>")
                for c in row:
                    if is_header:
                        html_parts.append(f"<th>{normalize_cell_value(c)}</th>")
                    else:
                        html_parts.append(f"<td>{normalize_cell_value(c)}</td>")
                html_parts.append("</tr>")
                is_header = False

    html_parts.append("</table></body></html>")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    return {"success": True}


# ============================================================================
# 4. WORD (DOCX) CONVERSIONS
# ============================================================================

def convert_word_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Microsoft Word (.docx) document to PDF via ReportLab flowables"""
    if not docx or not SimpleDocTemplate:
        raise RuntimeError("python-docx and reportlab are required for Word to PDF.")

    doc = docx.Document(input_path)
    styles = getSampleStyleSheet()

    elements = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            if p.style.name.startswith("Heading 1"):
                elements.append(Paragraph(f"<b>{txt}</b>", styles["Heading1"]))
                elements.append(Spacer(1, 8))
            elif p.style.name.startswith("Heading 2"):
                elements.append(Paragraph(f"<b>{txt}</b>", styles["Heading2"]))
                elements.append(Spacer(1, 6))
            elif p.style.name.startswith("Heading 3"):
                elements.append(Paragraph(f"<b>{txt}</b>", styles["Heading3"]))
                elements.append(Spacer(1, 4))
            else:
                elements.append(Paragraph(txt, styles["Normal"]))
                elements.append(Spacer(1, 6))

    for t in doc.tables:
        t_data = []
        for r in t.rows:
            t_data.append([c.text.strip() for c in r.cells])
        if t_data:
            rl_table = Table(t_data)
            rl_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(rl_table)
            elements.append(Spacer(1, 10))

    if not elements:
        elements.append(Paragraph("Empty Word Document", styles["Normal"]))

    pdf_doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    pdf_doc.build(elements)

    return {
        "success": True,
        "paragraphs": len(doc.paragraphs),
        "tables": len(doc.tables)
    }


def convert_word_to_txt(input_path: str, output_path: str) -> Dict[str, Any]:
    """Extract plain text from Word (.docx)"""
    if not docx:
        raise RuntimeError("python-docx is required for Word to TXT.")

    doc = docx.Document(input_path)
    lines = [p.text for p in doc.paragraphs if p.text.strip()]

    for t in doc.tables:
        for r in t.rows:
            lines.append("\t".join([c.text.strip() for c in r.cells]))

    full_text = "\n".join(lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    return {
        "success": True,
        "characters": len(full_text)
    }


def convert_word_to_html(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Word (.docx) to HTML"""
    if not docx:
        raise RuntimeError("python-docx is required for Word to HTML.")

    doc = docx.Document(input_path)
    html_parts = [
        "<!DOCTYPE html>",
        "<html><head><meta charset='utf-8'><title>Word Document View</title>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111827; }",
        "h1, h2, h3 { color: #1f2937; margin-top: 1.5em; }",
        "p { margin-bottom: 1em; }",
        "table { width: 100%; border-collapse: collapse; margin: 20px 0; }",
        "th, td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 14px; }",
        "th { background: #f3f4f6; font-weight: 600; }",
        "</style></head><body>"
    ]

    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            if p.style.name.startswith("Heading 1"):
                html_parts.append(f"<h1>{txt}</h1>")
            elif p.style.name.startswith("Heading 2"):
                html_parts.append(f"<h2>{txt}</h2>")
            elif p.style.name.startswith("Heading 3"):
                html_parts.append(f"<h3>{txt}</h3>")
            else:
                html_parts.append(f"<p>{txt}</p>")

    for t in doc.tables:
        html_parts.append("<table>")
        for r_i, r in enumerate(t.rows):
            html_parts.append("<tr>")
            for c in r.cells:
                tag = "th" if r_i == 0 else "td"
                html_parts.append(f"<{tag}>{c.text.strip()}</{tag}>")
            html_parts.append("</tr>")
        html_parts.append("</table>")

    html_parts.append("</body></html>")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    return {"success": True}


def convert_word_to_md(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Word (.docx) to Markdown"""
    if not docx:
        raise RuntimeError("python-docx is required for Word to Markdown.")

    doc = docx.Document(input_path)
    md_lines = []

    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            if p.style.name.startswith("Heading 1"):
                md_lines.append(f"# {txt}\n")
            elif p.style.name.startswith("Heading 2"):
                md_lines.append(f"## {txt}\n")
            elif p.style.name.startswith("Heading 3"):
                md_lines.append(f"### {txt}\n")
            else:
                md_lines.append(f"{txt}\n")

    for t in doc.tables:
        t_data = []
        for r in t.rows:
            t_data.append([c.text.strip() for c in r.cells])
        if t_data and len(t_data[0]) > 0:
            header = t_data[0]
            md_lines.append("| " + " | ".join(header) + " |")
            md_lines.append("| " + " | ".join(["---"] * len(header)) + " |")
            for r in t_data[1:]:
                padded = r + [""] * (len(header) - len(r))
                md_lines.append("| " + " | ".join(padded[:len(header)]) + " |")
            md_lines.append("\n")

    full_md = "\n".join(md_lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_md)

    return {"success": True}


# ============================================================================
# 5. IMAGE CONVERSIONS
# ============================================================================

def convert_image(input_path: str, output_path: str, target_format: str) -> Dict[str, Any]:
    """Convert between PNG, JPG, and WEBP formats"""
    if not Image:
        raise RuntimeError("Pillow (PIL) is required for image conversion.")

    fmt = target_format.lower()
    img = Image.open(input_path)

    if fmt in ["jpg", "jpeg"]:
        if img.mode in ("RGBA", "LA", "P"):
            # Fill transparency with white background
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.save(output_path, "JPEG", quality=95)
    elif fmt == "png":
        img.save(output_path, "PNG")
    elif fmt == "webp":
        img.save(output_path, "WEBP", quality=90)
    else:
        raise ValueError(f"Unsupported image format: {target_format}")

    return {
        "success": True,
        "width": img.width,
        "height": img.height
    }


def convert_image_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert single image to PDF"""
    if not Image:
        raise RuntimeError("Pillow (PIL) is required for image to PDF.")

    img = Image.open(input_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.save(output_path, "PDF", resolution=150.0)

    return {
        "success": True,
        "width": img.width,
        "height": img.height
    }


def convert_multiple_images_to_pdf(image_paths: List[str], output_path: str) -> Dict[str, Any]:
    """Merge multiple images into a single multi-page PDF"""
    if not Image:
        raise RuntimeError("Pillow (PIL) is required for multi-image to PDF.")

    if not image_paths:
        raise ValueError("No images provided for PDF generation.")

    pil_images = []
    for p in image_paths:
        im = Image.open(p)
        if im.mode != "RGB":
            im = im.convert("RGB")
        pil_images.append(im)

    first = pil_images[0]
    rest = pil_images[1:] if len(pil_images) > 1 else []
    first.save(output_path, "PDF", save_all=True, append_images=rest)

    return {
        "success": True,
        "pages": len(pil_images)
    }


# ============================================================================
# 6. TEXT AND DATA CONVERSIONS
# ============================================================================

def convert_txt_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert plain text file into formatted PDF"""
    if not SimpleDocTemplate:
        raise RuntimeError("reportlab is required for TXT to PDF.")

    with open(input_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []
    for line in content.split("\n"):
        if line.strip():
            elements.append(Paragraph(line.strip(), styles["Normal"]))
        else:
            elements.append(Spacer(1, 6))

    if not elements:
        elements.append(Paragraph("Empty Text Document", styles["Normal"]))

    doc.build(elements)
    return {"success": True}


def convert_txt_to_docx(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert plain text file to Microsoft Word (.docx)"""
    if not docx:
        raise RuntimeError("python-docx is required for TXT to DOCX.")

    with open(input_path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    doc = docx.Document()
    for l in lines:
        clean = l.strip()
        if clean:
            doc.add_paragraph(clean)

    doc.save(output_path)
    return {"success": True, "paragraphs": len(lines)}


def convert_json_to_csv(input_path: str, output_path: str) -> Dict[str, Any]:
    """Flatten JSON array of objects to CSV"""
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]
    elif not isinstance(data, list):
        raise ValueError("JSON must be an array of objects or an object to convert to CSV.")

    # Collect all unique headers across all records
    headers = []
    for item in data:
        if isinstance(item, dict):
            for k in item.keys():
                if k not in headers:
                    headers.append(k)

    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for item in data:
            if isinstance(item, dict):
                # Format nested dictionaries / lists as JSON strings
                row = {}
                for k in headers:
                    val = item.get(k, "")
                    if isinstance(val, (dict, list)):
                        row[k] = json.dumps(val, ensure_ascii=False)
                    else:
                        row[k] = normalize_cell_value(val)
                writer.writerow(row)

    return {"success": True, "records": len(data), "columns": len(headers)}


def convert_json_to_xlsx(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert JSON array of objects to Excel workbook"""
    if not openpyxl:
        raise RuntimeError("openpyxl is required for JSON to Excel.")

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]
    elif not isinstance(data, list):
        raise ValueError("JSON must be an array of objects.")

    headers = []
    for item in data:
        if isinstance(item, dict):
            for k in item.keys():
                if k not in headers:
                    headers.append(k)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "JSON Export"

    header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    for col_i, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_i, value=h)
        cell.fill = header_fill
        cell.font = header_font

    for row_i, item in enumerate(data, 2):
        if isinstance(item, dict):
            for col_i, h in enumerate(headers, 1):
                val = item.get(h, "")
                if isinstance(val, (dict, list)):
                    val = json.dumps(val, ensure_ascii=False)
                ws.cell(row=row_i, column=col_i, value=val)

    # Column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 40)

    wb.save(output_path)
    return {"success": True, "records": len(data)}


def convert_json_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert JSON to structured table or code representation in PDF"""
    if not SimpleDocTemplate:
        raise RuntimeError("reportlab is required for JSON to PDF.")

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    styles = getSampleStyleSheet()
    elements = [
        Paragraph("<b>JSON Data Report</b>", styles["Heading2"]),
        Spacer(1, 12)
    ]

    # If array of flat objects: render as table
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        headers = list(data[0].keys())[:8]  # Limit to 8 cols for PDF width
        table_rows = [headers]
        for item in data[:100]:  # Limit rows per single table
            row = [str(item.get(h, ""))[:40] for h in headers]
            table_rows.append(row)

        t = Table(table_rows, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ]))
        elements.append(t)
    else:
        # Preformatted JSON
        formatted_json = json.dumps(data, indent=2, ensure_ascii=False)
        elements.append(Preformatted(formatted_json, styles["Code"]))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    doc.build(elements)
    return {"success": True}


def convert_markdown_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Markdown document into formatted PDF"""
    if not SimpleDocTemplate:
        raise RuntimeError("reportlab is required for Markdown to PDF.")

    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    styles = getSampleStyleSheet()
    elements = []

    for l in lines:
        line = l.strip()
        if line.startswith("# "):
            elements.append(Paragraph(f"<b>{line[2:]}</b>", styles["Heading1"]))
            elements.append(Spacer(1, 8))
        elif line.startswith("## "):
            elements.append(Paragraph(f"<b>{line[3:]}</b>", styles["Heading2"]))
            elements.append(Spacer(1, 6))
        elif line.startswith("### "):
            elements.append(Paragraph(f"<b>{line[4:]}</b>", styles["Heading3"]))
            elements.append(Spacer(1, 4))
        elif line.startswith("- ") or line.startswith("* "):
            elements.append(Paragraph(f"&bull; {line[2:]}", styles["Normal"]))
        elif line:
            elements.append(Paragraph(line, styles["Normal"]))
            elements.append(Spacer(1, 4))

    if not elements:
        elements.append(Paragraph("Empty Markdown Document", styles["Normal"]))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    doc.build(elements)
    return {"success": True}


def convert_markdown_to_html(input_path: str, output_path: str) -> Dict[str, Any]:
    """Convert Markdown to clean HTML"""
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    html_parts = [
        "<!DOCTYPE html>",
        "<html><head><meta charset='utf-8'><title>Markdown View</title>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111827; }",
        "h1, h2, h3 { color: #1f2937; margin-top: 1.5em; }",
        "code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }",
        "pre { background: #1f2937; color: #fff; padding: 16px; border-radius: 8px; overflow-x: auto; }",
        "</style></head><body>"
    ]

    for l in lines:
        line = l.strip()
        if line.startswith("# "):
            html_parts.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("## "):
            html_parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("### "):
            html_parts.append(f"<h3>{line[4:]}</h3>")
        elif line.startswith("- ") or line.startswith("* "):
            html_parts.append(f"<li>{line[2:]}</li>")
        elif line:
            html_parts.append(f"<p>{line}</p>")

    html_parts.append("</body></html>")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    return {"success": True}


def convert_html_to_pdf(input_path: str, output_path: str) -> Dict[str, Any]:
    """Extract HTML elements and format into ReportLab PDF"""
    if not SimpleDocTemplate:
        raise RuntimeError("reportlab is required for HTML to PDF.")

    with open(input_path, "r", encoding="utf-8", errors="replace") as f:
        html_content = f.read()

    # Strip HTML tags simply and render text
    clean_text = re.sub(r'<[^>]+>', '\n', html_content)
    clean_lines = [l.strip() for l in clean_text.split('\n') if l.strip()]

    styles = getSampleStyleSheet()
    elements = [
        Paragraph("<b>HTML Document Export</b>", styles["Heading2"]),
        Spacer(1, 10)
    ]

    for line in clean_lines:
        elements.append(Paragraph(line, styles["Normal"]))
        elements.append(Spacer(1, 4))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    doc.build(elements)
    return {"success": True}


# ============================================================================
# MAIN DISPATCHER
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Bot Bro Universal File Converter")
    parser.add_argument("--source", required=True, help="Path to input file")
    parser.add_argument("--target", required=True, help="Path to output file or directory")
    parser.add_argument("--from-format", required=True, help="Source format (e.g. pdf, xlsx, csv)")
    parser.add_argument("--to-format", required=True, help="Target format (e.g. csv, xlsx, pdf)")
    parser.add_argument("--extra", default=None, help="JSON string of extra options (e.g. sheet_name, image_list)")

    args = parser.parse_args()

    src_fmt = args.from_format.lower().lstrip(".")
    tgt_fmt = args.to_format.lower().lstrip(".")

    extra = {}
    if args.extra:
        try:
            extra = json.loads(args.extra)
        except Exception:
            pass

    try:
        # PDF Dispatches
        if src_fmt == "pdf":
            if tgt_fmt == "csv":
                result = convert_pdf_to_csv(args.source, args.target)
            elif tgt_fmt in ["xlsx", "xls"]:
                result = convert_pdf_to_xlsx(args.source, args.target)
            elif tgt_fmt in ["docx", "doc"]:
                result = convert_pdf_to_docx(args.source, args.target)
            elif tgt_fmt == "txt":
                result = convert_pdf_to_txt(args.source, args.target)
            elif tgt_fmt == "md":
                result = convert_pdf_to_md(args.source, args.target)
            elif tgt_fmt in ["png", "jpg", "jpeg"]:
                result = convert_pdf_to_images(args.source, args.target, tgt_fmt)
            else:
                raise ValueError(f"Unsupported PDF target format: {tgt_fmt}")

        # Excel Dispatches
        elif src_fmt in ["xlsx", "xls"]:
            if tgt_fmt == "csv":
                result = convert_excel_to_csv(args.source, args.target, extra.get("sheet_name"))
            elif tgt_fmt == "pdf":
                result = convert_excel_to_pdf(args.source, args.target)
            elif tgt_fmt == "json":
                result = convert_excel_to_json(args.source, args.target)
            elif tgt_fmt == "html":
                result = convert_excel_to_html(args.source, args.target)
            else:
                raise ValueError(f"Unsupported Excel target format: {tgt_fmt}")

        # CSV Dispatches
        elif src_fmt == "csv":
            if tgt_fmt in ["xlsx", "xls"]:
                result = convert_csv_to_xlsx(args.source, args.target)
            elif tgt_fmt == "json":
                result = convert_csv_to_json(args.source, args.target)
            elif tgt_fmt == "pdf":
                result = convert_csv_to_pdf(args.source, args.target)
            elif tgt_fmt == "html":
                result = convert_csv_to_html(args.source, args.target)
            else:
                raise ValueError(f"Unsupported CSV target format: {tgt_fmt}")

        # Word Dispatches
        elif src_fmt in ["docx", "doc"]:
            if tgt_fmt == "pdf":
                result = convert_word_to_pdf(args.source, args.target)
            elif tgt_fmt == "txt":
                result = convert_word_to_txt(args.source, args.target)
            elif tgt_fmt == "html":
                result = convert_word_to_html(args.source, args.target)
            elif tgt_fmt == "md":
                result = convert_word_to_md(args.source, args.target)
            else:
                raise ValueError(f"Unsupported Word target format: {tgt_fmt}")

        # Image Dispatches
        elif src_fmt in ["png", "jpg", "jpeg", "webp"]:
            if tgt_fmt in ["png", "jpg", "jpeg", "webp"]:
                result = convert_image(args.source, args.target, tgt_fmt)
            elif tgt_fmt == "pdf":
                if extra.get("images"):
                    result = convert_multiple_images_to_pdf(extra["images"], args.target)
                else:
                    result = convert_image_to_pdf(args.source, args.target)
            else:
                raise ValueError(f"Unsupported Image target format: {tgt_fmt}")

        # Text and Data Dispatches
        elif src_fmt == "txt":
            if tgt_fmt == "pdf":
                result = convert_txt_to_pdf(args.source, args.target)
            elif tgt_fmt in ["docx", "doc"]:
                result = convert_txt_to_docx(args.source, args.target)
            else:
                raise ValueError(f"Unsupported TXT target format: {tgt_fmt}")

        elif src_fmt == "json":
            if tgt_fmt == "csv":
                result = convert_json_to_csv(args.source, args.target)
            elif tgt_fmt in ["xlsx", "xls"]:
                result = convert_json_to_xlsx(args.source, args.target)
            elif tgt_fmt == "pdf":
                result = convert_json_to_pdf(args.source, args.target)
            else:
                raise ValueError(f"Unsupported JSON target format: {tgt_fmt}")

        elif src_fmt == "md":
            if tgt_fmt == "pdf":
                result = convert_markdown_to_pdf(args.source, args.target)
            elif tgt_fmt == "html":
                result = convert_markdown_to_html(args.source, args.target)
            else:
                raise ValueError(f"Unsupported Markdown target format: {tgt_fmt}")

        elif src_fmt == "html":
            if tgt_fmt == "pdf":
                result = convert_html_to_pdf(args.source, args.target)
            else:
                raise ValueError(f"Unsupported HTML target format: {tgt_fmt}")

        else:
            raise ValueError(f"Unsupported source format: {src_fmt}")

        # Return standardized JSON response to stdout
        output_size = os.path.getsize(args.target) if os.path.exists(args.target) and os.path.isfile(args.target) else 0
        response = {
            "success": result.get("success", True),
            "sourceFormat": src_fmt,
            "targetFormat": tgt_fmt,
            "outputSize": output_size,
            "metadata": result
        }
        print(json.dumps(response))

    except Exception as e:
        err_res = {
            "success": False,
            "error": str(e),
            "sourceFormat": src_fmt,
            "targetFormat": tgt_fmt
        }
        print(json.dumps(err_res))
        sys.exit(1)


if __name__ == "__main__":
    main()
