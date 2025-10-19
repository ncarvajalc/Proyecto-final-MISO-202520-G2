"""Data transfer objects to support supplier bulk upload workflows."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    ValidationError,
    field_validator,
    model_validator,
)

from .supplier import SupplierCertificate, SupplierCreate


CertificateDict = Dict[str, Any]


class SupplierBulkUploadRow(BaseModel):
    """Represents a single row parsed from the suppliers bulk upload file."""

    nombre: str = Field(..., min_length=1)
    id_tax: str = Field(..., min_length=1)
    direccion: str = Field(..., min_length=1)
    telefono: str = Field(..., min_length=1)
    correo: EmailStr
    contacto: str = Field(..., min_length=1)
    estado: str = Field(default="Activo", description="Estado del proveedor en el catálogo")
    certificado: Optional[SupplierCertificate] = None
    row_number: Optional[int] = Field(default=None, alias="rowNumber", ge=1)

    @staticmethod
    def _strip_value(value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @classmethod
    def _strip_field(cls, value: Any) -> Any:
        return cls._strip_value(value)

    _strip_fields = field_validator(
        "nombre",
        "id_tax",
        "direccion",
        "telefono",
        "correo",
        "contacto",
        mode="before",
    )(_strip_field)

    @field_validator("estado", mode="before")
    def _normalize_estado(cls, value: Optional[str]) -> str:  # noqa: D401
        """Normaliza el estado permitiendo variantes de texto comunes."""

        if value in (None, "", " "):
            return "Activo"

        normalized = str(value).strip().lower()
        if normalized in {"activo", "activa"}:
            return "Activo"
        if normalized in {"inactivo", "inactiva", "inactive"}:
            return "Inactivo"
        raise ValueError("El estado debe ser 'Activo' o 'Inactivo'.")

    @model_validator(mode="before")
    def _build_certificate(cls, values: Dict[str, Any]) -> Dict[str, Any]:  # noqa: D401
        """Map certificate columns into a :class:`SupplierCertificate` instance."""

        payload = cls._extract_certificate_payload(values)

        if payload:
            certificate = SupplierCertificate(**payload)
            if certificate.is_empty():
                values.setdefault("certificado", None)
            else:
                values["certificado"] = certificate
        else:
            values.setdefault("certificado", None)

        return values

    @staticmethod
    def _extract_certificate_payload(values: Dict[str, Any]) -> CertificateDict:
        certificate_payload: CertificateDict = {}

        nested_candidates = [
            values.get("certificado"),
            values.get("certificate"),
        ]

        for container in nested_candidates:
            if isinstance(container, dict):
                certificate_payload.update(container)

        aliases = {
            "nombre": {
                "certificadoNombre",
                "certificado_nombre",
                "certificado.nombre",
                "certificateName",
                "certificate_name",
                "certificate.nombre",
                "nombreCertificado",
            },
            "cuerpoCertificador": {
                "certificadoCuerpo",
                "certificado_cuerpo",
                "certificado.cuerpo",
                "certificateBody",
                "certificate_body",
                "certificate.cuerpo",
                "cuerpoCertificador",
                "entidadCertificadora",
            },
            "fechaCertificacion": {
                "certificadoFechaCertificacion",
                "certificado_fecha_certificacion",
                "certificado.fecha_certificacion",
                "certificateIssuedAt",
                "certificate_issued_at",
                "certificate.fecha_certificacion",
                "fechaCertificacion",
            },
            "fechaVencimiento": {
                "certificadoFechaVencimiento",
                "certificado_fecha_vencimiento",
                "certificado.fecha_vencimiento",
                "certificateExpiresAt",
                "certificate_expires_at",
                "certificate.fecha_vencimiento",
                "fechaVencimiento",
            },
            "urlDocumento": {
                "certificadoUrl",
                "certificado_url",
                "certificado.url",
                "certificateUrl",
                "certificate_url",
                "certificate.url",
                "urlDocumento",
            },
        }

        def pick_value(key: str, candidates: set[str]) -> Optional[Any]:
            if key in certificate_payload:
                return certificate_payload[key]
            for alias in candidates:
                if "." in alias:
                    root, nested_key = alias.split(".", 1)
                    container = values.get(root)
                    if isinstance(container, dict) and nested_key in container:
                        return container[nested_key]
                if alias in values:
                    return values[alias]
            return None

        normalized_payload: CertificateDict = {}
        for key, candidates in aliases.items():
            value = pick_value(key, candidates)
            if isinstance(value, str):
                value = value.strip()
            if value not in (None, ""):
                normalized_payload[key] = value

        return normalized_payload

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    def to_supplier_create(self) -> SupplierCreate:
        """Build a :class:`SupplierCreate` instance from the row information."""

        payload = self.model_dump(
            include={
                "nombre",
                "id_tax",
                "direccion",
                "telefono",
                "correo",
                "contacto",
                "estado",
                "certificado",
            }
        )
        return SupplierCreate(**payload)

    def to_supplier_payload(self) -> Dict[str, Any]:
        """Return the payload compatible with supplier creation endpoints."""

        return self.to_supplier_create().model_dump(mode="python", exclude_none=True)


class SupplierBulkUploadError(BaseModel):
    """Represents a validation or persistence error for a specific CSV row."""

    row_number: int = Field(..., alias="rowNumber", ge=1)
    errors: List[Dict[str, Any]] = Field(..., min_length=1)
    raw_data: Optional[Dict[str, Any]] = Field(default=None, alias="rawData")

    model_config = ConfigDict(populate_by_name=True)


class SupplierBulkUploadSummary(BaseModel):
    """Aggregated counters for a bulk upload processing."""

    total_rows: int = Field(..., ge=0, alias="totalRows")
    processed_rows: int = Field(..., ge=0, alias="processedRows")
    succeeded: int = Field(..., ge=0)
    failed: int = Field(..., ge=0)

    @model_validator(mode="after")
    def _validate_consistency(self) -> "SupplierBulkUploadSummary":  # noqa: D401
        if self.processed_rows != self.succeeded + self.failed:
            raise ValueError("Las filas procesadas deben coincidir con exitosas y fallidas.")
        if self.total_rows < self.processed_rows:
            raise ValueError("El total de filas no puede ser menor a las procesadas.")
        return self

    model_config = ConfigDict(populate_by_name=True)


class SupplierBulkUploadFile(BaseModel):
    """Represents the uploaded file and the successfully parsed rows."""

    filename: str
    content_type: str = Field(..., alias="contentType")
    rows: List[SupplierBulkUploadRow] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

    def to_supplier_creates(self) -> List[SupplierCreate]:
        """Return valid supplier creation models derived from the rows."""

        return [row.to_supplier_create() for row in self.rows]

    def to_supplier_payloads(self) -> List[Dict[str, Any]]:
        """Return payloads ready to be sent to the supplier creation endpoint."""

        return [row.to_supplier_payload() for row in self.rows]


class SupplierBulkUploadResult(BaseModel):
    """Serializable result that groups file metadata, summary and row errors."""

    file: SupplierBulkUploadFile
    summary: SupplierBulkUploadSummary
    errors: List[SupplierBulkUploadError] = Field(default_factory=list)
    message: Optional[str] = Field(
        default=None,
        description="Mensaje human readable con el resultado del procesamiento",
    )

    model_config = ConfigDict(populate_by_name=True)


def aggregate_bulk_upload_rows(
    filename: str,
    content_type: str,
    raw_rows: Iterable[Dict[str, Any]],
    *,
    starting_row_number: int = 2,
) -> SupplierBulkUploadResult:
    """Aggregate raw rows into validated models and structured errors."""

    valid_rows: List[SupplierBulkUploadRow] = []
    errors: List[SupplierBulkUploadError] = []

    for default_row_number, raw_row in enumerate(raw_rows, start=starting_row_number):
        row_data = raw_row or {}
        row_number = (
            row_data.get("rowNumber")
            or row_data.get("row_number")
            or default_row_number
        )
        try:
            row = SupplierBulkUploadRow(**{**row_data, "rowNumber": row_number})
        except ValidationError as exc:
            error_details = exc.errors()
            if error_details:
                errors.append(
                    SupplierBulkUploadError(
                        rowNumber=row_number,
                        errors=error_details,
                        rawData=row_data or None,
                    )
                )
        else:
            valid_rows.append(row)

    errors.sort(key=lambda error: error.row_number)

    processed_rows = len(valid_rows) + len(errors)
    summary = SupplierBulkUploadSummary(
        totalRows=processed_rows,
        processedRows=processed_rows,
        succeeded=len(valid_rows),
        failed=len(errors),
    )

    file_model = SupplierBulkUploadFile(
        filename=filename,
        contentType=content_type,
        rows=valid_rows,
    )

    return SupplierBulkUploadResult(file=file_model, summary=summary, errors=errors)


__all__ = [
    "SupplierBulkUploadRow",
    "SupplierBulkUploadError",
    "SupplierBulkUploadSummary",
    "SupplierBulkUploadFile",
    "SupplierBulkUploadResult",
    "aggregate_bulk_upload_rows",
]
