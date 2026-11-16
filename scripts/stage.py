"""Sets schedule.json to one stage of the posting ramp (ali, 16 Nov 2026: "we need to post 40 times a day for each platform").

  python3 scripts/stage.py N     N = 1 (16 stories a day), 2 (24), 3 (32) or 4 (40)

The most one account takes in 24 hours, from each platform's own docs (Zernio's docs for the same numbers): Instagram
50 (Meta's pages say 50 and 100), Facebook 30 Reels, TikTok about 15, YouTube unpublished (10 on 29 Oct 2026). So a story
goes to every platform at stage 1 and, at stage 4, to Instagram at all 40 times, Facebook at 29, TikTok at 13 and YouTube
at 6, with "caps" (Instagram 44, Facebook 29, TikTok 13, YouTube 8 from this repo, which leaves room for the daily Social
post and a re-post) as the backstop in scripts/post.py. The times keep the 10 older ones and add the rest between them.
"""
import json,os,sys
# The ramp: story posting times per stage (UTC), nested, and which platforms take which slot.
E=["11:30","13:00","14:00","16:30","18:00","19:30","21:00","23:00","00:30","02:00"]
grid=[f"{h:02d}:{m:02d}" for h in range(24) for m in (0,30) if not (4<=h<8)]
assert len(grid)==40 and set(E)<=set(grid)
def mins(s): h,m=map(int,s.split(":")); return h*60+m
def circ(a,b): d=abs(a-b)%1440; return min(d,1440-d)
chosen=list(E); order=[]
rest=[g for g in grid if g not in chosen]
while rest:
    best=max(rest,key=lambda g:(min(circ(mins(g),mins(c)) for c in chosen),-mins(g)))
    chosen.append(best); order.append(best); rest.remove(best)
sizes={1:16,2:24,3:32,4:40}
def stage(n):
    k=sizes[n]-10
    return sorted(E+order[:k],key=mins)
def spread(slots,n,keep=()):
    """n of the slots spread evenly (the ones in keep always stay)."""
    slots=sorted(slots,key=mins)
    if n>=len(slots): return slots
    pick=[slots[int(i*len(slots)/n)] for i in range(n)]
    for k in keep:
        if k in slots and k not in pick:
            near=min(pick,key=lambda p:circ(mins(p),mins(k))); pick[pick.index(near)]=k
    return sorted(set(pick),key=mins)
def config(n):
    ts=stage(n)
    tt={1:12,2:13,3:13,4:13}[n]
    fb={1:99,2:99,3:29,4:29}[n]
    yt={1:5,2:6,3:6,4:6}[n]
    return {"times":ts,"youtube_times":spread(ts,yt,keep=("14:00","18:00","23:00")[:min(3,yt)]),
            "platform_times":{"tiktok":spread(ts,tt),"facebook":spread(ts,fb)},
            "caps":{"instagram":44,"facebook":29,"tiktok":13,"youtube":8},"fill_gaps":True}
if __name__=="__main__":
    n=int(sys.argv[1]); c=config(n)
    path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"schedule.json")
    s=json.load(open(path)); s.update(c); s["stage"]=n
    json.dump(s,open(path,"w"),indent=2); open(path,"a").write("\n")
    print({k:(len(v) if isinstance(v,list) else v) for k,v in c.items() if k!="platform_times"}, {k:len(v) for k,v in c["platform_times"].items()})
    print(c["times"]); print("yt",c["youtube_times"]); print("tt",c["platform_times"]["tiktok"])
