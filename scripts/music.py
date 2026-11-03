# Original background music for one story or lesson. Usage: python3 scripts/music.py OUT.wav SECONDS SEED [bright]
# Every story from 014 on and every lesson (seed 500 and up) get the new music (scripts/musiclib.py: ten styles, real
# chords and melodies, ali 3 Nov 2026), whatever their look. Stories 001 to 013 keep the first recipe
# (scripts/music_dark.py) so they can still be remade as they were.
import runpy
import sys

if (len(sys.argv) > 4 and sys.argv[4] == "bright") or int(sys.argv[3]) >= 14:
    import musiclib

    plan = musiclib.make_plan(int(sys.argv[3]), True)
    musiclib.write_wav(sys.argv[1], musiclib.render(plan, float(sys.argv[2])))
    print(f"{sys.argv[1]}: {sys.argv[2]}s, {plan['style']}, key {plan['key_pc']} {plan['mode']}, {plan['bpm']:.0f} bpm, chords {[c['deg'] for c in plan['chords']]}")
else:
    sys.path.insert(0, __import__("os").path.dirname(__file__))
    runpy.run_path(__import__("os").path.join(__import__("os").path.dirname(__file__), "music_dark.py"), run_name="__main__")
