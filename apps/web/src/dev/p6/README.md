# P6 V2 local Showroom review

`http://localhost:5173/showroom` renders this 11-team livery study in Vite DEV. The production Showroom uses the owner-selected Model B asset. `?review=model-b` opens the earlier Model B material review in DEV.

The runtime and its 51 referenced artwork files are self-contained in this directory. It does not import from `scratch/`. The frozen Model B file is still loaded through the existing DEV-only `/__peds-review/model-b.glb` route from `source-assets/models/model-b/model-b-eds-optimized-v1.glb`; preserve that source asset when organizing the repository.

`officialArtwork.ts` records the source for each copied mark. The photos, brand marks, and derived artwork remain limited to local owner review. The historical ten-team sponsor and visual gaps still require owner review; the old `scratch/` QA report was disposed of with the approved cleanup. Do not treat a successful build or working team selector as visual approval.
