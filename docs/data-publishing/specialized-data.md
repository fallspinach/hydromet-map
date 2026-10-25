# Specialized or Previously Unseen Data

Use this path when a common profile does not adequately describe the data or
interaction. A new renderer is acceptable; do not force a new scientific concept
into a misleading existing type. The common contract still applies to identity,
provenance, quantities, units, coordinates, time, encoding, quality and version.

## Interactive integration process

1. **Producer supplies intent and samples.** Describe what the data represent,
   intended users/interactions, one ordinary case, and known limitations. A URL,
   sketch or partial metadata is enough to start; coding knowledge is unnecessary.
2. **Agent/maintainer inspects the publication.** Inventory files and existing
   metadata, identify reusable profiles, and distinguish observed facts from
   assumptions. Document gaps instead of inferring scientific meaning.
3. **Producer resolves scientific questions.** Confirm coordinates, units, time
   semantics, masks, encodings, quality flags and statistical interpretation.
   An agent cannot infer these reliably from a plausible-looking visualization.
4. **Agree a small extension contract.** Record required metadata, versioned
   decoding rules, reference samples, performance targets and unsupported cases.
   Keep any executable adapter in reviewed application code, not in the manifest.
5. **Build and review a preview.** Producer checks scientific interpretation;
   maintainer checks decoding, failure behavior and browser compatibility.
6. **Document the accepted extension.** Retain examples and limitations. Promote
   it to a common profile only when repeated use justifies a stable convention.

## Existing worked examples

| Example | Current implementation references | Questions future producers must answer |
| --- | --- | --- |
| Encoded vector-field textures / IVT particles | [Published IVT contract](../particle-tracers.md), [renderer](../../src/features/gfsIvtParticles/GfsIvtParticlesLayer.jsx) | Component basis/sign, component versus magnitude units, quantization, masks, grid order, longitude wrapping and clipping |
| Aircraft trajectories | [AR Recon loader](../../src/lib/arReconData.js), [3D renderer](../../src/features/arRecon3d/ArRecon3dLayer.jsx) | Position/time association, horizontal and vertical references, height versus pressure, gaps, interpolation and flight identity |
| Dropsonde vertical profiles | [AR Recon loader](../../src/lib/arReconData.js), [sonde popup](../../src/features/arRecon3d/ArReconSondePopup.jsx) | Profile/flight IDs, vertical coordinate and units, sample time and drift, variable meanings, quality flags and missing levels |

These examples are existing contracts, not mandated formats for all future
vector fields, trajectories or profiles. Reuse them only when their scientific
assumptions and renderer capabilities fit.

The IVT contract is an important exception to ordinary PNG interpretation:
RGBA bytes encode two numerical components, and alpha carries component data.
It is not transparency. It uses a separate validity mask and decoding that avoids
alpha premultiplication. A new encoded texture must explicitly distinguish its
encoding from a precolored raster; a normal browser image path may alter bytes.

Vertical exaggeration, particle speed scaling and trail appearance are display
choices, not changes to physical source values. Declare source references and
physical units independently of such choices. Unsupported vertical datums or
component bases require an explicit conversion agreement rather than a silent
assumption.

## Integration record to keep

Record the sample URLs/revisions, profile/extension ID, producer-approved meaning,
encoding equations, expected decoded values, supported operations, preview
results, performance observations, unresolved limitations and responsible
contacts. Link that record from the manifest or accompanying documentation.
An agent should be able to continue the integration without reconstructing these
decisions from an old chat transcript.
