import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False, # Permite mantener los loggers de Uvicorn
    "formatters": {
        "standard": {
            # Define un formato claro: timestamp, nivel, nombre del logger, mensaje
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "level": "INFO", # Nivel mínimo para el output de la consola
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "standard",
            "filename": "app.log",
            "maxBytes": 1024 * 1024 * 5, # 5 MB
            "backupCount": 5, # Mantener hasta 5 archivos de backup
            "level": "DEBUG", # Nivel mínimo para el archivo (más detalle)
        },
    },
    "loggers": {
        # Configuración específica para el logger de tu app
        "my_app": {
            "handlers": ["console", "file"],
            "level": "DEBUG", # El logger de la app registra todo desde DEBUG
            "propagate": False,
        },
        # Mantener la configuración de Uvicorn pero quizás cambiar el nivel
        "uvicorn": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

def setup_logging():
    logging.config.dictConfig(LOGGING_CONFIG)