"""Download and verify the fixed release inputs; reconstruct the public ZIP.

Usage: python3 scripts/restore.py music|samples|archive [--offline]
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / 'production/release-manifest.json').read_text(encoding='utf-8'))
CACHE = ROOT / 'output/downloads'


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def valid(path, item):
    return path.is_file() and path.stat().st_size == item['size'] and digest(path) == item['sha256']


def fetch(item, offline):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / item['name']
    if valid(path, item):
        print('Verified:', path.name, flush=True)
        return path
    if offline:
        raise RuntimeError(f'Missing or invalid: {path}')
    url = ('https://github.com/' + MANIFEST['repository'] + '/releases/download/' +
           MANIFEST['release'] + '/' + urllib.parse.quote(item['name']))
    temp = path.with_name(path.name + '.download')
    print('Downloading:', item['name'], flush=True)
    try:
        with urllib.request.urlopen(url, timeout=120) as response, temp.open('wb') as output:
            shutil.copyfileobj(response, output, 4 * 1024 * 1024)
        if not valid(temp, item):
            raise RuntimeError(f'Checksum mismatch: {item["name"]}')
        temp.replace(path)
    finally:
        temp.unlink(missing_ok=True)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=['music', 'samples', 'archive'])
    parser.add_argument('--offline', action='store_true', help='Use files already placed in output/downloads')
    args = parser.parse_args()
    assets = {item['name']: item for item in MANIFEST['assets']}
    if args.kind == 'music':
        for name in ['music-bed.wav', 'orchestral-master-20s.wav']:
            src = fetch(assets[name], args.offline)
            shutil.copyfile(src, ROOT / 'output' / name)
    elif args.kind == 'samples':
        src = fetch(assets['orchestral-samples.zip'], args.offline)
        with zipfile.ZipFile(src) as archive:
            target = (ROOT / 'music/orchestral-samples').resolve()
            for item in archive.infolist():
                dest = (ROOT / item.filename).resolve()
                if not dest.is_relative_to(target):
                    raise RuntimeError('Unexpected sample path')
            archive.extractall(ROOT)
    else:
        target = ROOT / 'output' / MANIFEST['archive']['name']
        if valid(target, MANIFEST['archive']):
            print('Verified archive:', target)
            return
        parts = [fetch(item, args.offline) for item in MANIFEST['parts']]
        temp = target.with_name(target.name + '.assembling')
        try:
            with temp.open('wb') as output:
                for part in parts:
                    with part.open('rb') as stream:
                        shutil.copyfileobj(stream, output, 4 * 1024 * 1024)
            if not valid(temp, MANIFEST['archive']):
                raise RuntimeError('Reconstructed archive checksum mismatch')
            temp.replace(target)
        finally:
            temp.unlink(missing_ok=True)
        print('Archive ready (unzip to view):', target)


if __name__ == '__main__':
    main()
