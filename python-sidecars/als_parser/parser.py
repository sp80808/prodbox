"""
als_parser — Ableton Live Set (.als) project file parser.

Ableton .als files are gzip-compressed XML documents.
This sidecar is bundled by Tauri (via PyInstaller) and invoked via the Tauri
shell plugin.

Usage (from Tauri command):
    als_parser <path-to-file.als>

Output:
    JSON written to stdout — parsed project metadata.
"""

import gzip
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def parse_als(path: str) -> dict:
    """Parse an Ableton Live Set and return metadata as a dict."""
    with gzip.open(path, 'rb') as f:
        xml_bytes = f.read()

    root = ET.fromstring(xml_bytes)

    # Top-level Ableton element carries the version info
    version = root.attrib.get('MinorVersion', 'unknown')

    # Live Set is the first child
    live_set = root.find('LiveSet')
    if live_set is None:
        raise ValueError('Not a valid Ableton Live Set — <LiveSet> element missing.')

    # Extract track names
    tracks = []
    for track in live_set.findall('.//AudioTrack') + live_set.findall('.//MidiTrack'):
        name_el = track.find('.//Name/EffectiveName')
        if name_el is not None:
            tracks.append(name_el.attrib.get('Value', ''))

    # BPM
    tempo_el = live_set.find('.//Tempo/Manual')
    bpm = float(tempo_el.attrib['Value']) if tempo_el is not None else None

    return {
        'format':   'als',
        'version':  version,
        'bpm':      bpm,
        'tracks':   tracks,
        'trackCount': len(tracks),
    }


def main() -> None:
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: als_parser <file.als>'}))
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(json.dumps({'error': f'File not found: {path}'}))
        sys.exit(1)

    try:
        result = parse_als(path)
        print(json.dumps(result))
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({'error': str(exc)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
