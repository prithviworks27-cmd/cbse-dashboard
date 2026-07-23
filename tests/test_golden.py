"""Golden-file test: known input spreadsheets (tests/fixtures/) -> known
output JSON (tests/fixtures/expected_dashboard.json), exercised through the
pipeline's public API (the same manifest-driven CLI entrypoint a real run
uses), including JSON-schema validation of the result.

If you intentionally change pipeline behavior, regenerate the golden file
with:
    python tests/generate_fixtures.py   # only if fixtures themselves changed
    python data-pipeline/build.py --config tests/fixtures/manifest.json \
        --out tests/fixtures/expected_dashboard.json
and review the diff carefully before committing.
"""
import json
import os

from conftest import FIXTURES_DIR

from build import run_from_manifest, validate_against_schema

MANIFEST_PATH = os.path.join(FIXTURES_DIR, "manifest.json")
EXPECTED_PATH = os.path.join(FIXTURES_DIR, "expected_dashboard.json")


def test_golden_dashboard(tmp_path):
    out_path = str(tmp_path / "dashboard.json")
    run_from_manifest(MANIFEST_PATH, out_path)

    with open(out_path) as f:
        actual = json.load(f)
    with open(EXPECTED_PATH) as f:
        expected = json.load(f)

    assert actual == expected


def test_golden_output_validates_against_schema():
    out_path_dir = os.path.join(FIXTURES_DIR)
    tmp_out = os.path.join(out_path_dir, "_tmp_golden_check.json")
    try:
        run_from_manifest(MANIFEST_PATH, tmp_out)
        with open(tmp_out) as f:
            data = json.load(f)
        validate_against_schema(data)  # raises if invalid
    finally:
        if os.path.exists(tmp_out):
            os.remove(tmp_out)


def test_enrollment_gating_in_golden_fixture():
    """Diya Patel is enrolled in Physics + Maths only (see roster.csv), NOT
    Chemistry -- but the raw Chemistry tracking grid fixture includes a row
    for her marked Submitted. She must not leak into the output."""
    with open(EXPECTED_PATH) as f:
        expected = json.load(f)

    chem = expected["trackingOnly"]["Chemistry"]
    assert "Diya Patel" not in chem["submissions"]

    phys_leaderboard_names = {row["student"] for row in expected["scored"]["Physics"]["leaderboard"]}
    assert phys_leaderboard_names == {"Aarav Sharma", "Diya Patel", "Kabir Singh"}
