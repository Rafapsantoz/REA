"""REA - Gravador de Tela de Alta Performance para Windows."""

from src.config import RecorderConfig, DEFAULT_CONFIG, get_default_config
from src.recorder import ScreenRecorder, RecorderState
from src.ui import ScreenRecorderUI

__all__ = [
    "RecorderConfig",
    "DEFAULT_CONFIG",
    "get_default_config",
    "ScreenRecorder",
    "RecorderState",
    "ScreenRecorderUI",
]
