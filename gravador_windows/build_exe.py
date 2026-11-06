"""
Script de Build Standalone para o RPsec Recorder.
Empacota a aplicação em um executável autônomo portátil para Windows (RPsecRecorder.exe)
utilizando PyInstaller.

Uso:
    python build_exe.py
    python build_exe.py --clean
    python build_exe.py --onedir (para modo diretório, mais rápido para testes)
    python build_exe.py --console (mantém terminal aberto para depuração de logs)
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Raiz do projeto
ROOT_DIR = Path(__file__).resolve().parent
ENTRY_POINT = ROOT_DIR / "main.py"
OUTPUT_NAME = "RPsecRecorder"
DIST_DIR = ROOT_DIR / "dist"
BUILD_DIR = ROOT_DIR / "build"
SPEC_FILE = ROOT_DIR / f"{OUTPUT_NAME}.spec"


def check_prerequisites():
    """Verifica se todos os requisitos e pacotes necessários estão instalados."""
    print("[*] Verificando ambiente e dependências de empacotamento...")

    try:
        import PyInstaller
        print(f"    [OK] PyInstaller versão: {PyInstaller.__version__}")
    except ImportError:
        print("[ERRO] PyInstaller não está instalado no ambiente!")
        print("Instale com: pip install pyinstaller")
        sys.exit(1)

    try:
        import customtkinter
        print(f"    [OK] CustomTkinter versão: {customtkinter.__version__}")
    except ImportError:
        print("[ERRO] CustomTkinter não encontrado!")
        sys.exit(1)

    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        print(f"    [OK] FFmpeg embutido: {ffmpeg_exe}")
    except Exception as e:
        print(f"[ERRO] FFmpeg via imageio-ffmpeg não encontrado: {e}")
        sys.exit(1)

    if not ENTRY_POINT.exists():
        print(f"[ERRO] Ponto de entrada não encontrado: {ENTRY_POINT}")
        sys.exit(1)


def clean_build_artifacts():
    """Remove pastas temporárias de build anteriores."""
    print("[*] Limpando artefatos de builds anteriores...")
    for folder in [DIST_DIR, BUILD_DIR]:
        if folder.exists():
            try:
                shutil.rmtree(folder)
                print(f"    [OK] Removido: {folder}")
            except Exception as e:
                print(f"    [AVISO] Não foi possível remover {folder}: {e}")

    if SPEC_FILE.exists():
        try:
            SPEC_FILE.unlink()
            print(f"    [OK] Removido spec: {SPEC_FILE}")
        except Exception:
            pass


def build_executable(onefile: bool = True, windowed: bool = True, clean: bool = True):
    """Executa o empacotamento com PyInstaller."""
    if clean:
        clean_build_artifacts()

    print("\n" + "=" * 65)
    print(f"       INICIANDO EMPACOTAMENTO STANDALONE - {OUTPUT_NAME}.exe       ")
    print("=" * 65)

    # Argumentos base do PyInstaller
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--name", OUTPUT_NAME,
        "--paths", str(ROOT_DIR),
    ]

    # Modo arquivo único vs diretório
    if onefile:
        cmd.append("--onefile")
        print("[*] Modo: Arquivo único portátil (--onefile)")
    else:
        cmd.append("--onedir")
        print("[*] Modo: Diretório distribuível (--onedir)")

    # Modo janela (sem console) vs console
    if windowed:
        cmd.append("--noconsole")
        print("[*] Interface: Modo Desktop Windowed sem console (--noconsole)")
    else:
        cmd.append("--console")
        print("[*] Interface: Modo Console com logs visíveis (--console)")

    # Coleta completa de bibliotecas dinâmicas e ativos essenciais
    collected_packages = [
        "customtkinter",
        "imageio_ffmpeg",
        "sounddevice",
    ]

    # Se sounddevice_data existir, adiciona
    try:
        import _sounddevice_data
        collected_packages.append("_sounddevice_data")
    except ImportError:
        pass

    for pkg in collected_packages:
        cmd.extend(["--collect-all", pkg])
        print(f"[*] Coletando ativos e binários: {pkg}")

    # Hidden imports essenciais para Windows e ctypes
    hidden_imports = [
        "pynput.keyboard._win32",
        "pynput.mouse._win32",
        "scipy.io.wavfile",
        "PIL._tkinter_finder",
        "mss",
        "mss.windows",
        "ctypes",
        "ctypes.wintypes",
    ]

    for hi in hidden_imports:
        cmd.extend(["--hidden-import", hi])

    # Ícone oficial de gravação (.ico)
    icon_path = ROOT_DIR / "assets" / "icon.ico"
    if icon_path.exists():
        cmd.extend(["--icon", str(icon_path)])
        print(f"[*] Ícone oficial configurado: {icon_path}")

    # Pasta de ativos estáticos (assets/ -> assets/)
    assets_dir = ROOT_DIR / "assets"
    if assets_dir.exists():
        cmd.extend(["--add-data", f"{assets_dir};assets"])
        print(f"[*] Pasta de ativos embutida no pacote: {assets_dir}")

    # Ponto de entrada
    cmd.append(str(ENTRY_POINT))

    print("\n[*] Executando PyInstaller:")
    print(" ".join(cmd[:8]) + " ... [argumentos adicionais omitidos]")

    start_time = os.times().elapsed
    proc = subprocess.run(cmd)

    if proc.returncode != 0:
        print(f"\n[ERRO] O processo do PyInstaller falhou com código de saída {proc.returncode}.")
        sys.exit(proc.returncode)

    # Verifica o executável gerado
    exe_path = DIST_DIR / (f"{OUTPUT_NAME}.exe" if onefile else f"{OUTPUT_NAME}/{OUTPUT_NAME}.exe")
    if exe_path.exists():
        size_bytes = exe_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        print("\n" + "=" * 65)
        print("          BUILD CONCLUÍDO COM SUCESSO!          ")
        print("=" * 65)
        print(f" Localização: {exe_path}")
        print(f" Tamanho:     {size_mb:.2f} MB ({size_bytes} bytes)")
        print(" Status:      Pronto para distribuição autônoma portátil.")
        print("=" * 65 + "\n")
        return exe_path
    else:
        print(f"\n[ERRO] Executável esperado não encontrado em: {exe_path}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Build Standalone do REA Screen Recorder.")
    parser.add_argument("--onedir", action="store_true", help="Gera em modo pasta em vez de arquivo único.")
    parser.add_argument("--console", action="store_true", help="Mantém o console aberto para depuração de logs.")
    parser.add_argument("--no-clean", action="store_true", help="Não limpa os diretórios de build anteriores.")

    args = parser.parse_args()

    check_prerequisites()
    build_executable(
        onefile=not args.onedir,
        windowed=not args.console,
        clean=not args.no_clean,
    )


if __name__ == "__main__":
    main()
