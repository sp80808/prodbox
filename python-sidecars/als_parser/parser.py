"""
als_parser — Ableton Live Set (.als) project file parser.

Ableton .als files are gzip-compressed XML documents.
This sidecar is bundled by Tauri (via PyInstaller) and invoked via the Tauri
shell plugin.

Usage (from Tauri command):
    python3 parser.py <path-to-file.als>

Output:
    JSON written to stdout — parsed project metadata per Pillar 3 contract.
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

    live_set = root.find('LiveSet')
    if live_set is None:
        raise ValueError('Not a valid Ableton Live Set — <LiveSet> element missing.')

    # Extract BPM
    tempo_el = live_set.find('.//Tempo/Manual')
    bpm = float(tempo_el.attrib['Value']) if tempo_el is not None else 120.0

    # Extract time signature
    time_sig = '4/4'
    numerator_el = live_set.find('.//TimeSignature/Numerator/Manual')
    denominator_el = live_set.find('.//TimeSignature/Denominator/Manual')
    if numerator_el is not None and denominator_el is not None:
        time_sig = f"{numerator_el.attrib.get('Value', '4')}/{denominator_el.attrib.get('Value', '4')}"

    # Extract tracks
    tracks = []
    for track in live_set.findall('.//AudioTrack'):
        name_el = track.find('.//Name/EffectiveName')
        name = name_el.attrib.get('Value', 'Untitled') if name_el is not None else 'Untitled'
        tracks.append({
            'name': name,
            'type': 'audio',
            'stems': []
        })

    for track in live_set.findall('.//MidiTrack'):
        name_el = track.find('.//Name/EffectiveName')
        name = name_el.attrib.get('Value', 'Untitled') if name_el is not None else 'Untitled'
        tracks.append({
            'name': name,
            'type': 'midi',
            'stems': []
        })

    return {
        'format': 'als',
        'bpm': bpm,
        'sample_rate': 48000,
        'time_signature': time_sig,
        'tracks': tracks,
    }


def main() -> None:
    if len(sys.argv) != 2:
        print('ERROR: Usage: parser.py <file.als>', file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f'ERROR: File not found: {path}', file=sys.stderr)
        sys.exit(1)

    try:
        result = parse_als(path)
        print(json.dumps(result))
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
