"""Replay the archived FFmpeg recipes. Prints a plan unless --run is supplied."""
import argparse
import json
from pathlib import Path
import shlex
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    recipes = json.loads((ROOT / 'production/ffmpeg-recipes.json').read_text(encoding='utf-8'))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('step', choices=list(recipes))
    parser.add_argument('--run', action='store_true')
    args = parser.parse_args()
    command = recipes[args.step]
    print(shlex.join(command), flush=True)
    if not args.run:
        return
    if not shutil.which('ffmpeg'):
        raise SystemExit('Install FFmpeg and add it to PATH first.')
    for i, value in enumerate(command):
        if value == '-i' and not (ROOT / command[i + 1]).is_file():
            raise SystemExit('Missing input: ' + command[i + 1])
    destination = ROOT / command[-1]
    if destination.exists():
        raise SystemExit(f'Refusing to overwrite: {destination}; move or remove it first.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(command, cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
