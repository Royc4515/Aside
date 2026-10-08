"""
Cut the demo's music bed to fit marketing/demo/demo.html.

Track: "Minimal Technology" by BerryDeep, Pixabay Content License
https://pixabay.com/music/ambient-minimal-technology-612982/
It is not committed (the license forbids redistributing it on its own); download
it, then:

    FFMPEG=/path/to/ffmpeg py -3 marketing/demo/music_edit.py track.mp3 [out.wav]

The track runs at 116.25 BPM (bar = 2.0645 s, first downbeat 5.185 s after the
intro's silence). The edit, in video time:
  0.57 -> 19.47   track start; the drop lands on the Alt+A press (5.75 s)
  19.47 -> 27.94  the same groove 10 bars later, so the splice is inaudible:
                  10 bars is the only jump whose audio matches (rhythm
                  correlation 0.88; 11 or 12 bars score under 0.41 and "hop").
                  It plays through the model wall and into the track's own
                  drop-out, a breath right before the outro.
  27.94 -> 31.00  the track's final hit on the outro logo, with the drop-out's
                  pad tail fading underneath
Writes out/music.wav by default; render.mjs picks it up from there.
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48_000
DUR = 31.0
BAR = 2.0645
DROP = 5.185          # first downbeat after the intro's silence
KEYPRESS = 5.75       # Alt+A in demo.html
SPLICE_OUT = 18.900   # track time where the first passage ends
JUMP_BARS = 10        # don't touch / the only bar-aligned jump that matches (see docstring)
OUTRO = 27.944        # video time of the final hit (outro logo at 27.95)
FINAL_HIT = 108.42    # the track's last downbeat
SPLICE_XF = 0.025     # crossfade for the matched groove splice
TAIL_FADE = 0.6       # drop-out pad keeps ringing under the final hit


def decode(path: Path) -> np.ndarray:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'track.wav'
        subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(path),
                        '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', str(wav)], check=True)
        _, x = wavfile.read(wav)
    return x.astype(np.float64)


def align(x: np.ndarray, a: float, q: float, search: float = 0.008, win: float = 0.25) -> float:
    """Nudge q to the sample so the waveform after q lines up with the one after a.

    The bar grid is only accurate to a few ms; a misaligned crossfade between
    two copies of the same groove combs (phases) audibly, so align for real.
    """
    band = sosfilt(butter(4, [60, 4000], 'band', fs=SR, output='sos'), x.mean(1))
    ref = band[int(a * SR): int((a + win) * SR)]
    s = int(search * SR)
    cand = band[int(q * SR) - s: int((q + win) * SR) + s]
    c = fftconvolve(cand, ref[::-1], 'valid')
    return q - search + int(np.argmax(c)) / SR


def fade(n: int, rising: bool) -> np.ndarray:
    curve = np.sin(np.linspace(0, np.pi / 2, n)) if rising else np.cos(np.linspace(0, np.pi / 2, n))
    return curve[:, None]


def edit(x: np.ndarray) -> np.ndarray:
    lead = KEYPRESS - DROP
    q = align(x, SPLICE_OUT, SPLICE_OUT + JUMP_BARS * BAR)
    v_splice = lead + SPLICE_OUT
    b_end = q + (OUTRO - v_splice)
    n = int(DUR * SR)
    out = np.zeros((n + SR, 2))
    xf, tail = int(SPLICE_XF * SR), int(TAIL_FADE * SR)

    first = x[: int(SPLICE_OUT * SR) + xf].copy()
    first[-xf:] *= fade(xf, rising=False)
    i0 = int(lead * SR)
    out[i0:i0 + len(first)] += first

    second = x[int(q * SR): int(b_end * SR) + tail].copy()
    second[:xf] *= fade(xf, rising=True)
    second[-tail:] *= fade(tail, rising=False)
    i1 = int(v_splice * SR)
    out[i1:i1 + len(second)] += second

    ending = x[int(FINAL_HIT * SR): int((FINAL_HIT + DUR - OUTRO + 0.2) * SR)].copy()
    ending[: int(0.004 * SR)] *= fade(int(0.004 * SR), rising=True)
    i2 = int(OUTRO * SR)
    out[i2:i2 + len(ending)] += ending[: len(out) - i2]

    out = out[:n]
    t = np.arange(n) / SR
    return out * np.clip((DUR - t) / 0.35, 0, 1)[:, None]  # silent on the last frame


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    if not src.is_file():
        sys.exit(f'track not found: {src}')
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / 'out' / 'music.wav'
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, edit(decode(src)).astype(np.float32))
    print('wrote', out)


if __name__ == '__main__':
    main()
