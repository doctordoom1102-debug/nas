#!/usr/bin/env python3
"""
Patch IRCTC_CRIS.apk for NASA Control:
- Replace GADAR -> NASA Control
- Replace taslats/taslatss URLs -> our backend URL
- Replace auth5, auth6 -> our /api/v1/post-token

Requires: apktool, zipalign, apksigner (or jarsigner)
Install apktool: https://ibotpeaches.github.io/Apktool/install/
"""

import os
import re
import sys
import shutil
import subprocess
from pathlib import Path

# Config - set your backend base URL (no trailing slash)
BASE_URL = os.environ.get("NASA_BASE_URL", "https://nasanget.xyz")
TOKEN_URL = f"{BASE_URL.rstrip('/')}/api/v1/post-token"

REPLACEMENTS = [
    ("GADAR", "NASA Control"),
    ("Gadar", "NASA Control"),
    ("gadar", "nasa control"),
    ("https://auth5.taslats.com", BASE_URL.rstrip("/")),
    ("https://auth6.taslats.com", BASE_URL.rstrip("/")),
    ("https://auth5.taslatss.com", BASE_URL.rstrip("/")),
    ("https://auth6.taslatss.com", BASE_URL.rstrip("/")),
    ("https://www.taslatss.com", BASE_URL.rstrip("/")),
    ("https://mobile.taslatss.com", BASE_URL.rstrip("/")),
    ("taslatss.com", BASE_URL.replace("https://", "").replace("http://", "").split("/")[0]),
    ("taslats.com", BASE_URL.replace("https://", "").replace("http://", "").split("/")[0]),
]

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
APK_INPUT = Path(os.environ.get("APK_PATH", "C:/Users/Aditya4Sure/Downloads/cris.org.in.prs.ima_4.2.55-312_minAPI27(arm64-v8a,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk"))
if not APK_INPUT.exists():
    APK_INPUT = PROJECT_ROOT / "IRCTC_CRIS.apk"
APK_DECOMPILED = PROJECT_ROOT / "apk_decompiled"
APK_OUTPUT = PROJECT_ROOT / "public" / "IRCTC_NASA_Control.apk"


def run(cmd, cwd=None):
    print(f"  $ {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode != 0:
        raise SystemExit(f"Command failed: {cmd}")


def find_and_replace(dir_path):
    count = 0
    for root, dirs, files in os.walk(dir_path):
        for name in files:
            path = Path(root) / name
            try:
                if path.suffix in (".xml", ".json", ".txt", ".smali", ".yml", ".properties", ".html"):
                    data = path.read_bytes()
                    try:
                        text = data.decode("utf-8")
                    except UnicodeDecodeError:
                        try:
                            text = data.decode("utf-16")
                        except UnicodeDecodeError:
                            continue
                    orig = text
                    for old, new in REPLACEMENTS:
                        text = text.replace(old, new)
                    if text != orig:
                        path.write_text(text, encoding="utf-8")
                        count += 1
                        print(f"  Patched: {path.relative_to(dir_path)}")
            except Exception as e:
                print(f"  Skip {path}: {e}")
    return count


def main():
    print("NASA Control APK Patcher")
    print("=" * 40)
    print(f"Base URL: {BASE_URL}")
    print(f"Token URL: {TOKEN_URL}")
    print(f"Input APK: {APK_INPUT}")
    print(f"Output APK: {APK_OUTPUT}")
    print()

    if not APK_INPUT.exists():
        print("ERROR: Input APK not found. Set APK_PATH or place IRCTC_CRIS.apk in project root.")
        sys.exit(1)

    # Check apktool (local or PATH)
    apktool = shutil.which("apktool") or shutil.which("apktool.bat")
    local_apktool = SCRIPT_DIR / "apktool" / "apktool.bat"
    if not apktool and local_apktool.exists():
        apktool = str(local_apktool)
    if not apktool:
        print("ERROR: apktool not found. Install from https://ibotpeaches.github.io/Apktool/")
        sys.exit(1)

    # Decompile
    print("1. Decompiling APK...")
    if APK_DECOMPILED.exists():
        shutil.rmtree(APK_DECOMPILED)
    run([apktool, "d", str(APK_INPUT), "-o", str(APK_DECOMPILED), "-f"])

    # Patch
    print("\n2. Patching strings...")
    n = find_and_replace(APK_DECOMPILED)
    print(f"   Patched {n} files.")

    # Fix duplicate classes (apktool rebuild fails when dexload + audience_network have same classes)
    # Remove dexload copies that exist in audience_network - keeps one copy per class
    dexload_root = APK_DECOMPILED / "smali_assets" / "dexload"
    aud_root = APK_DECOMPILED / "smali_assets" / "audience_network"
    removed = 0
    if dexload_root.exists() and aud_root.exists():
        for p in dexload_root.rglob("*.smali"):
            rel = p.relative_to(dexload_root)
            if (aud_root / rel).exists():
                p.unlink()
                removed += 1
        if removed:
            print(f"\n   Removed {removed} duplicate smali files (apktool rebuild fix)")

    # Rebuild
    print("\n3. Rebuilding APK...")
    APK_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    run([apktool, "b", str(APK_DECOMPILED), "-o", str(APK_OUTPUT)])

    # Sign (optional - use debug keystore or your own)
    print("\n4. Signing...")
    jarsigner = shutil.which("jarsigner")
    if jarsigner:
        # Try to sign with debug key
        debug_keystore = Path.home() / ".android" / "debug.keystore"
        if debug_keystore.exists():
            run([jarsigner, "-keystore", str(debug_keystore), "-storepass", "android",
                 "-digestalg", "SHA1", "-sigalg", "SHA1withRSA", str(APK_OUTPUT), "androiddebugkey"])
            print("   Signed with debug.keystore")
        else:
            print("   Skipping sign (no debug.keystore). You must sign manually for install.")
    else:
        print("   Skipping sign (jarsigner not found). Use: apksigner sign --ks your.keystore IRCTC_NASA_Control.apk")

    print("\nDone! Output:", APK_OUTPUT)


if __name__ == "__main__":
    main()
