"""Fail-closed original-source P2.34G paired-phase tests; no mocked native car."""
from __future__ import annotations
import hashlib,json,os,shutil,tempfile,unittest
from pathlib import Path
import trimesh
from p2_34g_coupled_phase_gate import run,verify_original,pair_volumes,source,BALLS,SHAFT,CUP,PINS

ROOT=Path(os.environ.get('PEDS_P234G_ROOT',str(Path(__file__).resolve().parent)))
ORIGINAL=ROOT/'inputs'/'P234E_native'
AUDIT=ROOT/'outputs'/'P234G_coupled_cv_phase_84native_audit.json'
CSV=ROOT/'outputs'/'P234G_coupled_cv_phase_matrix.csv'
VIEW=ROOT/'inputs'/'preview'/'P234E_rear84_revised_ball_neutral_balanced.glb'

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

class TestP234GActualSource(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.original=verify_original(ORIGINAL)
  cls.data=json.loads(AUDIT.read_text())

 def test_actual_84_original_source_and_immutability(self):
  self.assertEqual(len(self.original),84)
  self.assertTrue(all(sha(ORIGINAL/n)==v for n,v in PINS.items()))
  self.assertIn(SHAFT,self.original);self.assertIn(CUP,self.original)
  self.assertEqual(len(BALLS),6)
  self.assertEqual(self.data['changedNativeSourcePartCount'],0)
  self.assertFalse(self.data['mechanicalG2Certified'])

 def test_full_matrix_pair_and_distance_accounting(self):
  a=self.data
  self.assertEqual(a['sampledCombinedPoseCount'],12)
  self.assertEqual(a['newExactOpenCascadeNativeBooleanCount'],144)
  self.assertEqual(a['exactBRepMinDistanceWitnessCount'],60)
  self.assertEqual((a['posesWithSignificantNativeInterference'],a['posesWithNoSignificantInterference']),(5,7))
  self.assertEqual(sum(len(r['perBallNativeBooleanEvidence']) for r in a['nativePoseEvidence']),72)
  self.assertEqual(len(a['twoRaceNativeDistanceWitnesses']),5)
  self.assertEqual(len(CSV.read_text().splitlines()),13)
  self.assertFalse(a['continuousPhaseSpaceExhaustivelyProven'])
  self.assertFalse(a['equalAngularVelocityOrTorqueCertified'])

 def test_native_coupled_races_collision_positive_control(self):
  got=pair_volumes(self.original,10,.6241,1.0254)
  self.assertEqual(got['significantInterferenceCount'],4)
  self.assertEqual(got['significantPairIds'],['1:cup','2:shaft','4:cup','5:shaft'])
  self.assertAlmostEqual(got['maxBallShaftInterferenceMm3'],.07080168,delta=.001)
  self.assertAlmostEqual(got['maxBallCupInterferenceMm3'],.05089122,delta=.001)

 def test_clear_phase_is_not_proof_of_two_sided_contact(self):
  phase=pair_volumes(self.original,10,.2481,.6133)
  self.assertTrue(phase['sampledPoseNominalClearancePass'])
  check=next(x for x in self.data['twoRaceNativeDistanceWitnesses'] if x['bendDeg']==10 and x['shaftSpinDeg']==.2481)
  self.assertEqual(check['ballsNearBothNativeSurfaces'],0)
  self.assertFalse(check['allSixNearBothAndNoLargeInterference'])
  straight=next(x for x in self.data['twoRaceNativeDistanceWitnesses'] if x['bendDeg']==0)
  self.assertEqual(straight['ballsNearBothNativeSurfaces'],6)
  self.assertTrue(straight['allSixNearBothAndNoLargeInterference'])

 def test_original_preview_unchanged_watertight_and_neutral(self):
  scene=trimesh.load(VIEW,force='scene')
  self.assertEqual(set(scene.graph.nodes_geometry),set(self.original))
  self.assertEqual(len(scene.geometry),84)
  self.assertEqual({tuple(map(int,m.visual.material.baseColorFactor)) for m in scene.geometry.values()},
                   {(135,146,157,255)})
  self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))

 def test_source_tamper_rejected_before_output(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);bad=root/'bad';shutil.copytree(ORIGINAL,bad)
   index=bad/'P234E_source84_name_index.json'
   index.write_bytes(index.read_bytes()+b'TAMPER')
   with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):run(bad,root/'blocked')
   self.assertFalse((root/'blocked').exists())

 def test_no_output_overwrite_and_no_false_car_claim(self):
  with self.assertRaises(FileExistsError):run(ORIGINAL,ROOT/'outputs')
  self.assertFalse(self.data['originalModelBVehicleIncluded'])
  self.assertFalse(self.data['simultaneousLoadedSixBallContactMeasured'])

if __name__=='__main__':unittest.main(verbosity=2)
