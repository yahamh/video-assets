"""Checks stories before they are made: the shape of the JSON, the length, the words, and repeats.

Usage: python3 scripts/check.py stories/*.json
Prints every problem and exits 1 if there is one. WRITING.md has the rules behind each check.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES = {p.stem.lower() for p in (ROOT / "src" / "scenes").glob("*.tsx")} - {"types", "end"}
READ_WPS, PAD_S, END_S = 3.4, 0.25, 2.0  # as in src/story.ts (voice A reads about 3.4 words a second)
LENGTH = (30.0, 40.0)
# Words and phrases that make a story sound machine-written (WRITING.md, "How it should sound").
BANNED = [
    "imagine", "little did", "in a world", "here's the twist", "but here's", "here's the thing", "here's why",
    "here's the kicker", "fast forward", "dive in", "delve", "tapestry", "testament", "shrouded", "legendary", "iconic",
    "breathtaking", "stunning", "unveil", "embark", "let that sink in", "you won't believe", "mind-blowing", "insane",
    "crazy", "secret no one", "history buffs", "journey of", "timeless", "elegance", "exquisite", "masterpiece",
    "nestled", "realm", "plot twist", "wait for it", "vibrant", "pivotal", "captivating", "intricate", "underscore",
    "crucial", "rich history", "serves as", "stands as", "boasts", "quietly", "no accident", "the result?",
    "the answer?", "what happened next", "but that wasn't", "and that's when", "it's not just", "not only",
    "artificial intelligence", " ai ", "a.i.",
]


def check(path, seen):
    problems = []
    say = lambda m: problems.append(f"{path.name}: {m}")
    try:
        s = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"{path.name}: not valid JSON ({e})"]
    for key in ("id", "number", "title", "lines", "sources", "post"):
        if key not in s:
            say(f"missing {key}")
    if problems:
        return problems
    if path.stem != s["id"]:
        say(f"file name should be {s['id']}.json")
    if not re.fullmatch(r"\d{3,4}-[a-z0-9-]+", s["id"]):
        say("id should look like 012-hope-diamond")
    if len({u for u in s["sources"] if u.startswith("http")}) < 2:
        say("needs at least two source links")
    if s.get("music") != f"music-{s['number']:03d}.wav":
        say(f"music should be music-{s['number']:03d}.wav (the workflow makes it)")
    total = END_S
    spoken = " ".join(l.get("say") or l.get("text", "") for l in s["lines"])
    sentences = [x.split() for x in re.split(r"(?<=[.!?])\s+", spoken.strip()) if x.strip()]
    tiny = [" ".join(x) for x in sentences if len(x) < 4]
    if len(tiny) > 1:
        say(f"too many tiny sentences ({' / '.join(tiny)}): a string of fragments sounds machine-made, join them")
    for a, b in zip(sentences, sentences[1:]):
        if len(a) < 6 and len(b) < 6:
            say(f"two short sentences in a row ({' '.join(a)} / {' '.join(b)}): join them or give one more to say")
    if sentences and sum(map(len, sentences)) / len(sentences) < 7:
        say("sentences average under 7 words: it reads like a list of punchlines, let some run on")
    if re.search(r"\bnot\b[^.]*\bbut\b|\bit'?s not\b", spoken.lower()):
        say("'not X but Y' or 'it's not X' is the clearest sign of machine writing, say the thing itself")
    threes = re.findall(r"\b\w+(?: \w+)?, \w+(?: \w+)?,? and \w+", spoken)
    if [m for m in threes if not re.search(r"hundred|thousand|million", m)]:
        say("a list of three: keep the real number of things, or pick the one that matters")
    for i, line in enumerate(s["lines"], 1):
        text, spoken = line.get("text", ""), line.get("say") or line.get("text", "")
        kind = (line.get("scene") or {}).get("kind")
        if kind not in SCENES:
            say(f"line {i}: unknown scene {kind!r} (have {', '.join(sorted(SCENES))})")
        n = len(text.split())
        if n > 12:
            say(f"line {i}: {n} words, keep a line to 12 or fewer")
        if re.search(r"\d", spoken) or re.search(r"\b[IVXLC]{2,}\b", spoken):
            say(f"line {i}: write numbers and Roman numerals out in 'say' ({spoken!r})")
        if re.search(r"[—–!?]", text + spoken):
            say(f"line {i}: no dashes, exclamation marks or questions")
        low = f" {text.lower()} {spoken.lower()} "
        for b in BANNED:
            if b in low:
                say(f"line {i}: {b.strip()!r} sounds made up or salesy, say it plainly")
        ends = re.search(r"[.!?][\"')\]]*$", spoken.strip())
        total += len(spoken.split()) / READ_WPS + (PAD_S if ends else 0) + (line.get("hold") or 0)
    if not LENGTH[0] <= total <= LENGTH[1]:
        say(f"runs about {total:.0f} s, aim for {LENGTH[0]:.0f} to {LENGTH[1]:.0f}")
    hook = s.get("hook") or {}
    words = len(str(hook.get("text", "")).split())
    if not 3 <= words <= 7:
        say(f"hook.text needs 3 to 7 words (has {words})")
    elif s["lines"] and hook["text"] != s["lines"][0].get("text"):
        say("the first line should read out the hook text, word for word")
    for g in hook.get("gold", []):
        if g.lower() not in hook.get("text", "").lower():
            say(f"hook.gold word {g!r} isn't in the hook text")
    if s["lines"] and s["lines"][0].get("scene", {}).get("kind") != "hook":
        say("the first scene should be kind 'hook': the payoff, big and moving")
    if any(l.get("scene", {}).get("kind") == "hook" for l in s["lines"][1:]):
        say("only the first scene is a hook")
    tags = s["post"].get("hashtags", [])
    if not 3 <= len(tags) <= 6:
        say("use 3 to 6 hashtags")
    topic = s.get("topic", "").strip().lower()
    if not topic:
        say("missing topic (the jewel or event, as a few words, used to stop repeats)")
    elif topic in seen and seen[topic] != s["id"]:
        say(f"topic {topic!r} was already told in {seen[topic]}")
    else:
        seen[topic] = s["id"]
    return problems


def main():
    seen = {}
    for p in sorted((ROOT / "stories").glob("*.json")):
        t = json.loads(p.read_text()).get("topic", "").strip().lower()
        if t and t not in seen:
            seen[t] = p.stem
    problems = [m for arg in sys.argv[1:] for m in check(Path(arg), seen)]
    print("\n".join(problems) or "all good")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
