# Cry Insight — Dataset

## Donate-a-Cry Corpus
The Cry Insight agent's category taxonomy and reference samples come from the
open-source **Donate-a-Cry corpus**.

- **Source:** https://github.com/gveres/donateacry-corpus
- **Categories (labels):** `belly_pain`, `burping`, `discomfort`, `hungry`, `tired`
- **Full corpus:** 457 labeled infant-cry recordings (cleaned subset)
- **Included here:** a 30-clip sample (6 per category) under `donateacry/<category>/`,
  plus `donateacry/manifest.json` (full per-category corpus counts + the committed sample list).
- **License:** see the source repository; used here for research / educational purposes.

## How it's used
At runtime `cry_kb.py` loads `donateacry/manifest.json` to:
1. drive the cry **category taxonomy**, and
2. attach a dataset-grounding note to each result (e.g. *"Grounded in the
   Donate-a-Cry corpus: 382 labeled 'hungry' reference clips (457 total)"*).

> Classification of the recorded audio is currently performed by Gemini's
> multimodal audio understanding against these categories; the dataset provides
> the taxonomy + reference grounding. A future upgrade can use the clips for
> audio-embedding nearest-neighbour lookup to classify directly from the corpus.
