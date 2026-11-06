"""Configurações globais e padrões do RPsec Recorder."""

from dataclasses import dataclass, field
from pathlib import Path
import os
import sys

# Diretórios base
BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = BASE_DIR / "temp"
DEFAULT_OUTPUT_DIR = BASE_DIR / "recordings"

# Cria diretórios se não existirem
TEMP_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class RecorderConfig:
    """Configurações de captura, vídeo, áudio e caminhos do gravador."""

    # Configurações de Vídeo
    fps: int = 30
    preset: str = "ultrafast"   # libx264 preset: ultrafast, superfast, veryfast, fast, medium
    crf: int = 23               # Qualidade H.264 (18=ótimo, 23=padrão equilibrado, 28=menor tamanho)
    video_codec: str = "libx264"
    pix_fmt: str = "yuv420p"    # Formato de pixel padrão universal para MP4
    format: str = "mp4"
    capture_cursor: bool = True # Captura o ponteiro/cursor do mouse em movimento no Windows

    # Configurações de Áudio
    audio_enabled: bool = False
    audio_samplerate: int = 44100
    audio_channels: int = 2
    audio_codec: str = "aac"
    audio_bitrate: str = "192k"

    # Captura e Atalhos
    default_monitor: int = 1    # 1 = Monitor Principal no mss (0 = Bounding Box de todos os monitores)
    default_hotkey: str = "F9"  # Atalho global padrão para iniciar/parar

    # Diretórios
    temp_dir: Path = field(default_factory=lambda: TEMP_DIR)
    output_dir: Path = field(default_factory=lambda: DEFAULT_OUTPUT_DIR)


# Instância padrão global
DEFAULT_CONFIG = RecorderConfig()


def get_default_config() -> RecorderConfig:
    """Retorna uma nova instância da configuração padrão."""
    return RecorderConfig()
