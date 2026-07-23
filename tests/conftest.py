import os
import sys

# The data-pipeline package uses flat internal imports (e.g. `import
# normalize`) rather than a dotted package path, because `data-pipeline`
# contains a hyphen and isn't itself a valid Python package name. Make its
# directory importable for all tests.
PIPELINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data-pipeline"))
if PIPELINE_DIR not in sys.path:
    sys.path.insert(0, PIPELINE_DIR)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
