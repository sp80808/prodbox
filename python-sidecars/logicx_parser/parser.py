"""
logicx_parser — Logic Pro X (.logicx) project file parser.

A .logicx bundle is a directory (macOS package) containing:
  - projectData           (binary plist)
  - Alternatives/000/     (the active alternative, also a binary plist)
  - Media/                (audio files — we do NOT touch these)

This sidecar uses Python's plistlib to read the binary plists and extract
high-level project metadata.  It is bundled by Tauri via PyInstaller.

Usage (from Tauri command):
    logicx_parser <path-to-project.logicx>

Output:
    JSON written to stdout — parsed project metadata.
"""

import json
import plistlib
import sys
from pathlib import Path


def parse_logicx(bundle_path: str) -> dict:
    """Parse a Logic Pro .logicx bundle and return metadata as a dict."""
    bundle = Path(bundle_path)
    if not bundle.is_dir():
        raise ValueError(f'{bundle_path} is not a directory — expected a .logicx bundle.')

    # The primary project data plist
    project_data_path = bundle / 'projectData'
    if not project_data_path.exists():
        raise ValueError('projectData not found inside the .logicx bundle.')

    with open(project_data_path, 'rb') as f:
        plist = plistlib.load(f)

    # Logic Pro stores the document metadata under 'documentInfo'
    doc_info = plist.get('documentInfo', {})
    version  = doc_info.get('version', 'unknown')

    # Attempt to read track count from the alternatives directory
    tracks: list[str] = []
    alt_dir = bundle / 'Alternatives' / '000'
    if alt_dir.is_dir():
        alt_plist_path = alt_dir / 'projectData'
        if alt_plist_path.exists():
            with open(alt_plist_path, 'rb') as f:
                alt_plist = plistlib.load(f)
            for track in alt_plist.get('tracks', []):
                name = track.get('name') or track.get('trackName') or ''
                tracks.append(name)

    return {
        'format':     'logicx',
        'version':    version,
        'tracks':     tracks,
        'trackCount': len(tracks),
    }


def main() -> None:
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: logicx_parser <file.logicx>'}))
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(json.dumps({'error': f'File not found: {path}'}))
        sys.exit(1)

    try:
        result = parse_logicx(path)
        print(json.dumps(result))
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({'error': str(exc)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
