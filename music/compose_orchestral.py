"""Original 20-second orchestral miniature using CC0 VSCO 2 CE recordings.

Run from any directory after fetching the samples listed in manifest.json.
No source melody, synth oscillator, electronic drum or arpeggiator is used.
"""
from fractions import Fraction
from functools import lru_cache
from pathlib import Path
import json

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / 'music/orchestral-samples'
SR = 48000
DURATION = 20
NAME = '长安万象-恢宏管弦版-20秒'


def pitched_files(folder, template, notes):
    """VSCO file labels use C3 for MIDI 60 (concert C4)."""
    classes = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'F': 5, 'G': 7, 'A': 9, 'A#': 10}
    return {12 * (int(n[-1]) + 2) + classes[n[:-1]]: folder / template.format(n)
            for n in notes}


BANKS = {
    'horn': pitched_files(SAMPLES / 'Brass/F Horn/sus', 'MOHorn_sus_{}_v2_1.wav',
                          ['D2', 'F2', 'A2', 'C3', 'A#1', 'G1']),
    'trombone': pitched_files(SAMPLES / 'Brass/Tenor Trombone/sus', 'tenortbn_sus_{}_v1_1.wav',
                              ['D2', 'F1', 'A#1']),
    'cello': pitched_files(SAMPLES / 'Strings/Cello Section/susvib', 'susvib_{}_v1_1.wav',
                           ['C1', 'G1', 'D2', 'F2', 'A2']),
    'violin': pitched_files(SAMPLES / 'Strings/Violin Section/susVib', 'VlnEns_susVib_{}_v2.wav',
                            ['D3', 'A3', 'C4', 'G4']),
}
BANKS['horn'][74] = SAMPLES / 'Brass/F Horn/sus/MOHorn_sus_D4_v1_1.wav'


@lru_cache(maxsize=64)
def sample(path, semitones=0):
    data, rate = sf.read(path, always_2d=True)
    if data.shape[1] == 1:
        data = np.repeat(data, 2, axis=1)
    ratio = Fraction(SR / (rate * 2 ** (semitones / 12))).limit_denominator(1000)
    data = resample_poly(data[:, :2], ratio.numerator, ratio.denominator, axis=0)
    # Match recording levels without flattening musical dynamics.
    rms = np.sqrt(np.mean(data[:min(len(data), SR * 3)] ** 2))
    return data * min(8, 0.12 / max(rms, 0.001))


def compose():
    rng = np.random.default_rng(1384)
    dry = np.zeros((SR * DURATION, 2))
    send = np.zeros_like(dry)
    events = []

    def mix(data, at, gain, pan=0, hall=0.35):
        start = round(at * SR)
        count = min(len(data), len(dry) - start)
        if count <= 0:
            return
        stereo = data[:count] * gain * np.array([1 - max(pan, 0) * .5, 1 + min(pan, 0) * .5])
        dry[start:start + count] += stereo
        send[start:start + count] += stereo * hall

    def note(bank, pitch, at, length, gain, pan=0, attack=.15, release=.55):
        root = min(BANKS[bank], key=lambda x: (abs(x - pitch), -x))
        data = sample(BANKS[bank][root], pitch - root)[:round(length * SR)].copy()
        # Scores deliberately keep notes shorter than the recorded sustains.
        if len(data) < round(length * SR):
            raise ValueError(f'Insufficient sustain: {bank} {pitch}')
        t = np.arange(len(data)) / SR
        envelope = np.minimum(t / attack, 1) * np.minimum((length - t) / release, 1)
        envelope *= .83 + .17 * np.sin(np.pi * t / length)
        data *= envelope[:, None]
        mix(data, at, gain, pan)
        events.append({'instrument': bank, 'midi': pitch, 'at': at, 'duration': length})

    # Spacious 60 BPM: four broad harmonic pillars, with a four-second release.
    harmonies = [(38, [50, 57], [62, 65, 69]),
                 (34, [46, 53], [62, 65, 70]),
                 (36, [48, 55], [60, 64, 67]),
                 (38, [50, 57], [62, 65, 69])]
    for bar, (bass, cellos, violins) in enumerate(harmonies):
        at = bar * 4 + .05
        length = 4.45 if bar < 3 else 6.3
        intensity = [.62, .78, .92, 1.12][bar]
        note('cello', bass, at, length, .74 * intensity, .18, .16, .8)
        for i, pitch in enumerate(cellos):
            note('cello', pitch, at + i * .025, length, .42 * intensity, .25, .3, .8)
        for i, pitch in enumerate(violins):
            note('violin', pitch, at + i * .035, length, .48 * intensity, -.28, .55, 1.1)
        if bar:
            for i, pitch in enumerate([bass + 12, bass + 19]):
                note('trombone', pitch, at + .07 + i * .02, length - .15,
                     .30 * intensity, .15, .24, .9)

    # Slow original horn phrase; broad held notes rather than a synth ostinato.
    melody = [(0.35, 62, 2.9, .62), (3.2, 57, 1.4, .55),
              (4.45, 62, 2.2, .73), (6.5, 65, 2, .76),
              (8.4, 64, 2, .83), (10.25, 67, 1.9, .9),
              (12.15, 69, 2.15, 1), (14.1, 65, 1.5, .9), (15.5, 62, 3.1, .8)]
    for at, pitch, length, gain in melody:
        note('horn', pitch, at, length, gain, -.08, .15, .4)
        note('horn', pitch - 12, at + .045, length, gain * .38, .22, .2, .5)

    # Real orchestral bass drum, timpani, suspended cymbal and gong.
    for i, (at, gain) in enumerate([(0.1, .75), (4.08, .85), (8.08, 1.0),
                                   (10.1, .48), (12.08, 1.25), (14.1, .6)]):
        drum = 'BDrumNewhit_v5_rr1_Sum.wav' if i % 2 == 0 else 'BDrumNewhit_v4_rr2_Sum.wav'
        mix(sample(SAMPLES / 'Percussion' / drum), at, gain, hall=.27)
    for at, gain in [(7.15, .35), (11.2, .5), (12.1, .6)]:
        mix(sample(SAMPLES / 'Percussion/Timpani/Timpani1_Hit_v3_rr1_Sum.wav'), at, gain, .1)
    gong = sample(SAMPLES / 'VSCO 1 Percussion/varMetal/Gong/gong_hit_mf_3.wav')
    mix(gong, .12, .18, hall=.55)
    mix(gong, 12.1, .36, hall=.55)
    mix(sample(SAMPLES / 'Percussion/susCymb1-hit_mp_rr1.wav'), 12.13, .32, -.15, .45)

    result = dry.copy()
    for delay, level in [(.045, .32), (.083, .23), (.127, .17)]:
        offset = round(delay * SR)
        result[offset:] += send[:-offset, ::-1] * level
    for ch in range(2):
        t = np.arange(round(3.5 * SR)) / SR
        impulse = rng.normal(0, 1, len(t)) * np.exp(-t * 2)
        impulse = sosfilt(butter(2, 5500, fs=SR, output='sos'), impulse)
        impulse[:round(.03 * SR)] = 0
        impulse *= .55 / np.sqrt(np.sum(impulse ** 2))
        result[:, ch] += fftconvolve(send[:, ch], impulse)[:len(result)]
    result = sosfilt(butter(2, 28, btype='highpass', fs=SR, output='sos'), result, axis=0)
    t = np.arange(len(result)) / SR
    result *= (np.minimum(t / .06, 1) * np.minimum((DURATION - t) / 2.1, 1) ** 1.35)[:, None]
    result *= 10 ** (-3 / 20) / np.max(np.abs(result))
    if not np.isfinite(result).all():
        raise ValueError('Non-finite audio')
    return result, events


if __name__ == '__main__':
    audio, score = compose()
    output = ROOT / 'output'
    output.mkdir(parents=True, exist_ok=True)
    sf.write(output / f'{NAME}-混音.wav', audio, SR, subtype='PCM_24')
    (output / f'{NAME}-制作记录.json').write_text(json.dumps({
        'title': '长安万象', 'duration': DURATION, 'sample_rate': SR,
        'source': 'VSCO 2 CE / CC0-1.0', 'composition': 'Original orchestral arrangement',
        'events': score}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(output / f'{NAME}-混音.wav')
