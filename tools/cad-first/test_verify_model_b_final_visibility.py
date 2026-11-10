"""Regression for empty F1 final mobile view from original reviews.zip.

Synthetic fixtures test ONLY frame occupancy; no fake geometry is ever passed
to the site or used for user-facing vehicle screenshots.
"""
from __future__ import annotations
import tempfile,unittest
from pathlib import Path
from PIL import Image,ImageDraw
from verify_model_b_final_visibility import inspect,enforce

class OwnerModelBFinalFramePixelQA(unittest.TestCase):
 def test_original_review_mobile_frame_fails_central_silhouette_gate(self):
  # Exact old user screenshot is optional when running tests in a new checkout;
  # use a synthetic mock of the reported failure for deterministic CI-free QA.
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'old-mobile-final.png'
   img=Image.new('RGB',(390,844),(8,14,24))
   d=ImageDraw.Draw(img)
   d.ellipse((-40,320,38,405),fill=(230,234,238))
   d.ellipse((352,380,435,465),fill=(230,234,238))
   img.save(path)
   proof=inspect(path)
   self.assertFalse(proof['passed'])
   with self.assertRaisesRegex(RuntimeError,'centre foreground visibility'):
    enforce(path)
 def test_original_f1_central_source_shape_passes(self):
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'synthetic-test-only.png'
   img=Image.new('RGB',(390,844),(8,14,24))
   d=ImageDraw.Draw(img)
   # Test silhouette region, not a car mesh. Merely validates pixel gate.
   d.polygon([(55,460),(95,422),(255,415),(334,460),(284,510),
              (100,519)],fill=(105,121,139))
   img.save(path)
   proof=enforce(path)
   self.assertTrue(proof['passed'])
   self.assertEqual(proof['canvasSize'],[390,844])
   self.assertEqual(proof['mechanicalG2'],'HOLD')
 def test_reject_wrong_aspect_and_blank_desktop(self):
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'blank-desktop.png'
   Image.new('RGB',(1440,900),(8,14,24)).save(path)
   with self.assertRaisesRegex(RuntimeError,'portrait'):
    inspect(path)
   self.assertFalse(inspect(path,False)['passed'])

if __name__=='__main__':unittest.main(verbosity=2)
