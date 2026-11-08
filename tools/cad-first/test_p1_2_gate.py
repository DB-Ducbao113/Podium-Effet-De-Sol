"""P1.2 source acceptance: pure checks, no owner assets in Git."""
import importlib.util
from pathlib import Path
import unittest
SCRIPT=Path(__file__).resolve().with_name("p1_2_geometry_gate.py")
spec=importlib.util.spec_from_file_location("p1_2_gate",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class GateContractTests(unittest.TestCase):
    def test_required_views_exact(self):
        self.assertEqual(len(module.REQUIRED),8)
        self.assertIn("front_three_quarter",module.REQUIRED)
    def test_required_lods(self):
        self.assertEqual(module.TIERS,("high","balanced","performance"))
    def test_no_release_flag_when_checking_silhouette(self):
        self.assertFalse("approved" in module.inspect.__doc__ if module.inspect.__doc__ else False)
if __name__=="__main__":
    unittest.main()
