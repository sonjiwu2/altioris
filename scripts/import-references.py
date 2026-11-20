"""Verify bundled Altioris PNGs or restore them from the original approved ZIP."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile


def verify(data, item):
    if not data.startswith(b"\x89PNG\r\n\x1a\n") or hashlib.sha256(data).hexdigest() != item["sha256"]:
        raise SystemExit("Reference integrity check failed: " + item["file"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", nargs="?", type=Path)
    args = parser.parse_args()

    folder = Path(__file__).resolve().parent.parent / "docs" / "references"
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    items = manifest["screens"]
    if len(items) != 11 or len({item["file"] for item in items}) != len(items):
        raise SystemExit("The approved reference inventory must contain 11 distinct files.")
    for item in items:
        target = item["file"]
        if Path(target).name != target or not target.endswith(".png"):
            raise SystemExit("Invalid reference target: " + target)

    if args.archive:
        copies = {}
        with ZipFile(args.archive) as archive:
            for item in items:
                source = archive.getinfo(item["file"])
                if source.file_size > 5_000_000:
                    raise SystemExit("Unexpected reference size: " + item["file"])
                data = archive.read(source)
                verify(data, item)
                copies[item["file"]] = data
        for name, data in copies.items():
            (folder / name).write_bytes(data)
        print(f"Imported {len(copies)} verified reference images.")
    else:
        for item in items:
            target = folder / item["file"]
            if not target.is_file():
                raise SystemExit("Missing reference: " + item["file"])
            verify(target.read_bytes(), item)
        print(f"Verified {len(items)} bundled reference images against SHA-256.")


if __name__ == "__main__":
    main()
