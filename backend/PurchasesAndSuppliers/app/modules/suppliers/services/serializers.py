"""Serialization helpers for supplier entities."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..models.orm import Supplier


def supplier_to_dict(supplier: Supplier) -> Dict[str, Any]:
    """Convert a :class:`Supplier` ORM instance into an API friendly dict."""

    certificate_values = {
        "nombre": supplier.certificado_nombre or "",
        "cuerpoCertificador": supplier.certificado_cuerpo or "",
        "fechaCertificacion": supplier.certificado_fecha_certificacion or "",
        "fechaVencimiento": supplier.certificado_fecha_vencimiento or "",
        "urlDocumento": supplier.certificado_url or "",
    }

    certificado: Optional[Dict[str, str]]
    if all(value == "" for value in certificate_values.values()):
        certificado = None
    else:
        certificado = certificate_values

    return {
        "id": supplier.id,
        "nombre": supplier.nombre,
        "id_tax": supplier.id_tax,
        "direccion": supplier.direccion,
        "telefono": supplier.telefono,
        "correo": supplier.correo,
        "contacto": supplier.contacto,
        "estado": supplier.estado,
        "certificado": certificado,
    }


__all__ = ["supplier_to_dict"]
