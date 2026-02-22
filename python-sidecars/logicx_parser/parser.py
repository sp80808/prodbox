"""
logicx_parser — Logic Pro X (.logicx) project file parser.

A .logicx bundle is a macOS directory package containing:
  - projectData           (binary plist)
  - Alternatives/000/     (the active alternative, also a binary plist)
  - Media/                (audio files — we do NOT touch these)

This sidecar uses Python's plistlib to read the binary plists and extract
high-level project metadata. It is bundled by Tauri via PyInstaller.

Usage (from Tauri command):
    python3 parser.py <path-to-project.logicx>

Output:
    JSON written to stdout — parsed project metadata per Pillar 3 contract.
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

    project_data_path = bundle / 'projectData'
    if not project_data_path.exists():
        raise ValueError('projectData not found inside the .logicx bundle.')

    with open(project_data_path, 'rb') as f:
        plist = plistlib.load(f)

    doc_info = plist.get('documentInfo', {})

    # Attempt to read track information from the alternatives directory
    tracks = []
    alt_dir = bundle / 'Alternatives' / '000'
    if alt_dir.is_dir():
        alt_plist_path = alt_dir / 'projectData'
        if alt_plist_path.exists():
            with open(alt_plist_path, 'rb') as f:
                alt_plist = plistlib.load(f)
            for track in alt_plist.get('tracks', []):
                name = track.get('name') or track.get('trackName') or 'Untitled'
                tracks.append({
                    'name': name,
                    'type': 'audio',
                    'stems': []
                })

    return {
        'format': 'logicx',
        'bpm': doc_info.get('tempo', 120),
        'sample_rate': doc_info.get('sampleRate', 48000),
        'time_signature': '4/4',
        'tracks': tracks,
    }


def main() -> None:
    if len(sys.argv) != 2:
        print('ERROR: Usage: parser.py <project.logicx>', file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f'ERROR: Path not found: {path}', file=sys.stderr)
        sys.exit(1)

    try:
        result = parse_logicx(path)
        print(json.dumps(result))
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
