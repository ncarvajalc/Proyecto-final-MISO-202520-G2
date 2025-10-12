"""Domain services to support suppliers bulk upload endpoints."""

from __future__ import annotations

import csv
import io
import re
from typing import List, Sequence, Tuple

from fastapi import UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..models import (
    SupplierBulkUploadError,
    SupplierBulkUploadFile,
    SupplierBulkUploadResult,
    SupplierBulkUploadRow,
    SupplierBulkUploadSummary,
    aggregate_bulk_upload_rows,
)
from ..models.orm import Supplier
from .serializers import supplier_to_dict


HEADER_NORMALIZATION_REGEX = re.compile(r"(?<!^)(?=[A-Z])")


def _normalize_header(field: str) -> str:
    """Return a normalized header name using snake_case."""

    field = (field or "").strip()
    if not field:
        return ""

    normalized = field.replace("-", "_")
    normalized = HEADER_NORMALIZATION_REGEX.sub("_", normalized)
    normalized = re.sub(r"\s+", "_", normalized)
    normalized = re.sub(r"_+", "_", normalized)
    return normalized.lower()


def parse_csv_bytes(content: bytes) -> List[dict[str, str]]:
    """Parse CSV bytes into a list of dictionaries."""

    stripped = content.strip()
    if not stripped:
        return []

    # ``utf-8-sig`` removes BOM when present without breaking ascii files.
    text_stream = io.StringIO(stripped.decode("utf-8-sig"))
    reader = csv.DictReader(text_stream)

    if reader.fieldnames is None:
        raise ValueError("El archivo CSV no contiene encabezados válidos.")

    normalized_headers = {_normalize_header(field) for field in reader.fieldnames}
    required_headers = {
        "nombre",
        "id_tax",
        "direccion",
        "telefono",
        "correo",
        "contacto",
    }
    if not required_headers.issubset(normalized_headers):
        raise ValueError(
            "El archivo CSV debe contener los encabezados obligatorios: "
            + ", ".join(sorted(required_headers))
        )

    normalized_rows: List[dict[str, str]] = []
    for row in reader:
        normalized_row: dict[str, str] = {}
        for key, value in (row or {}).items():
            normalized_key = _normalize_header(key)
            if not normalized_key:
                continue
            normalized_value = value.strip() if isinstance(value, str) else value
            normalized_row[normalized_key] = normalized_value
        normalized_rows.append(normalized_row)

    return normalized_rows


def read_upload_file(upload: UploadFile) -> Tuple[str, str, List[dict[str, str]]]:
    """Read an :class:`UploadFile` and return filename, content type and rows."""

    filename = upload.filename or "archivo.csv"
    content_type = upload.content_type or "text/plain"
    upload.file.seek(0)
    content = upload.file.read()

    rows = parse_csv_bytes(content)
    return filename, content_type, rows


PersistedSupplier = Tuple[Supplier, SupplierBulkUploadRow]


def persist_suppliers(
    db: Session, rows: Sequence[SupplierBulkUploadRow]
) -> Tuple[List[PersistedSupplier], List[SupplierBulkUploadError]]:
    """Persist validated supplier rows, collecting persistence errors."""

    created: List[PersistedSupplier] = []
    db_errors: List[SupplierBulkUploadError] = []

    for row in rows:
        supplier_payload = row.to_supplier_create()
        supplier = Supplier(**supplier_payload.to_orm_kwargs())
        db.add(supplier)
        try:
            db.commit()
        except SQLAlchemyError as exc:
            db.rollback()
            error_detail = {
                "loc": ("database",),
                "msg": str(exc.orig) if hasattr(exc, "orig") else str(exc),
                "type": exc.__class__.__name__,
            }
            db_errors.append(
                SupplierBulkUploadError(
                    rowNumber=row.row_number or 0,
                    errors=[error_detail],
                    rawData=row.model_dump(mode="python", by_alias=True),
                )
            )
        else:
            db.refresh(supplier)
            created.append((supplier, row))

    return created, db_errors


def build_summary(
    total_rows: int,
    succeeded: int,
    failed: int,
) -> SupplierBulkUploadSummary:
    """Return a consistent summary for the response."""

    return SupplierBulkUploadSummary(
        totalRows=total_rows,
        processedRows=total_rows,
        succeeded=succeeded,
        failed=failed,
    )


def build_result_response(
    *,
    filename: str,
    content_type: str,
    result: SupplierBulkUploadResult,
    persisted: Sequence[PersistedSupplier],
    db_errors: Sequence[SupplierBulkUploadError],
) -> dict:
    """Build the JSON serializable payload returned by the endpoint."""

    total_rows = result.summary.total_rows
    all_errors = list(result.errors) + list(db_errors)
    succeeded = len(persisted)
    failed = len(all_errors)

    summary = build_summary(total_rows=total_rows, succeeded=succeeded, failed=failed)

    persisted_rows = [row for _, row in persisted]

    file_model = SupplierBulkUploadFile(
        filename=filename,
        contentType=content_type,
        rows=persisted_rows,
    )

    message = f"{succeeded} proveedores creados, {failed} con errores"

    return {
        "success": failed == 0,
        "message": message,
        "file": file_model,
        "summary": summary,
        "errors": all_errors,
        "createdSuppliers": [supplier_to_dict(supplier) for supplier, _ in persisted],
    }


def process_bulk_upload(
    db: Session,
    upload: UploadFile,
    *,
    starting_row_number: int = 2,
) -> dict:
    """High level service that orchestrates the bulk upload workflow."""

    filename, content_type, rows = read_upload_file(upload)
    aggregation = aggregate_bulk_upload_rows(
        filename=filename,
        content_type=content_type,
        raw_rows=rows,
        starting_row_number=starting_row_number,
    )

    persisted, db_errors = persist_suppliers(db, aggregation.file.rows)
    return build_result_response(
        filename=filename,
        content_type=content_type,
        result=aggregation,
        persisted=persisted,
        db_errors=db_errors,
    )


__all__ = [
    "build_result_response",
    "build_summary",
    "PersistedSupplier",
    "parse_csv_bytes",
    "persist_suppliers",
    "process_bulk_upload",
    "read_upload_file",
]
