# APK Patch Instructions

Patch the IRCTC_CRIS.apk for NASA Control branding and to redirect tokens to your backend.

## Prerequisites

1. **Java JDK** (for apktool and signing)
2. **apktool** - [Download](https://ibotpeaches.github.io/Apktool/install/)
   - Windows: Download `apktool.bat` + `apktool.jar`, put in PATH
3. **Python 3** (script runs on Python)

## Quick Start

```bash
cd "C:\Users\Aditya4Sure\Desktop\New folder\nas"
set NASA_BASE_URL=https://your-backend.com
python scripts/patch_apk.py
```

Or place `IRCTC_CRIS.apk` in project root and run:

```bash
python scripts/patch_apk.py
```

Default base URL: `http://localhost:3000`

## What Gets Patched

| From | To |
|------|-----|
| GADAR | NASA Control |
| https://auth5.taslats.com | Your BASE_URL |
| https://auth6.taslats.com | Your BASE_URL |
| taslatss.com | Your domain |

## Output

- `apk_decompiled/` - Decompiled sources (can inspect)
- `IRCTC_NASA_Control.apk` - Patched and rebuilt APK

## Manual Steps (if script fails)

1. **Decompile:**
   ```bash
   apktool d IRCTC_CRIS.apk -o apk_decompiled -f
   ```

2. **Search and replace** in `apk_decompiled/`:
   - `res/values/strings.xml` - UI strings
   - `smali*/` - Code (search for "GADAR", "taslats", "auth5")

3. **Rebuild:**
   ```bash
   apktool b apk_decompiled -o IRCTC_NASA_Control.apk
   ```

4. **Sign:**
   ```bash
   apksigner sign --ks your.keystore IRCTC_NASA_Control.apk
   ```

## Note

The GADAR overlay/token sender may be in a **dynamically loaded DEX** (e.g. `assets/dexload.dex` or nested `origin610.apk`). If the main decompiled APK has no taslats/GADAR strings, you may need to:

- Decompile `assets/dexload.dex` separately with baksmali
- Or patch the nested `assets/origin610.apk` if that contains the overlay
