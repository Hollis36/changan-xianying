"""Offline checks for archived release recovery, including corrupt inputs."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore.py'))
restore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore)


def entry(name, data):
    return {'name': name, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


class RestoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.root_patch = patch.object(restore, 'ROOT', root)
        self.cache_patch = patch.object(restore, 'CACHE', root / 'output/downloads')
        self.root_patch.start(); self.cache_patch.start()
        self.addCleanup(self.root_patch.stop); self.addCleanup(self.cache_patch.stop)
        restore.CACHE.mkdir(parents=True)

    def run_main(self, kind):
        with patch.object(sys, 'argv', ['restore.py', kind, '--offline']), contextlib.redirect_stdout(io.StringIO()):
            restore.main()

    def manifest(self, parts=None, assets=None, total=b''):
        return {'parts': parts or [], 'assets': assets or [], 'archive': entry('final.zip', total)}

    def test_combine_order_and_idempotence(self):
        data = [b'first', b'last']
        parts = [entry(f'part{i}', chunk) for i, chunk in enumerate(data)]
        for item, chunk in zip(parts, data):
            (restore.CACHE / item['name']).write_bytes(chunk)
        with patch.object(restore, 'MANIFEST', self.manifest(parts, total=b''.join(data))):
            self.run_main('archive'); self.run_main('archive')
        self.assertEqual((restore.ROOT / 'output/final.zip').read_bytes(), b'firstlast')

    def test_reject_corrupt_part(self):
        item = entry('part0', b'good')
        (restore.CACHE / item['name']).write_bytes(b'evil')
        with patch.object(restore, 'MANIFEST', self.manifest([item], total=b'good')):
            with self.assertRaisesRegex(RuntimeError, 'Missing or invalid'):
                self.run_main('archive')
        self.assertFalse((restore.ROOT / 'output/final.zip').exists())

    def test_reject_bad_merged_checksum_and_remove_partial(self):
        item = entry('part0', b'good')
        (restore.CACHE / item['name']).write_bytes(b'good')
        with patch.object(restore, 'MANIFEST', self.manifest([item], total=b'wrong')):
            with self.assertRaisesRegex(RuntimeError, 'checksum'):
                self.run_main('archive')
        self.assertFalse((restore.ROOT / 'output/final.zip.assembling').exists())

    def test_sample_zip_cannot_escape_input_directory(self):
        path = restore.CACHE / 'orchestral-samples.zip'
        with zipfile.ZipFile(path, 'w') as archive:
            archive.writestr('../escaped.txt', 'bad')
        item = entry(path.name, path.read_bytes())
        with patch.object(restore, 'MANIFEST', self.manifest(assets=[item])):
            with self.assertRaisesRegex(RuntimeError, 'Unexpected sample path'):
                self.run_main('samples')
        self.assertFalse((restore.ROOT.parent / 'escaped.txt').exists())


if __name__ == '__main__':
    unittest.main()
