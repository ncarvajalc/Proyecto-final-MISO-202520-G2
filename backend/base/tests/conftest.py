import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

os.environ.setdefault("TESTING", "1")
