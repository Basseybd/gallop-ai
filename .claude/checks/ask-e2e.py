# Browser check for /ask with every provider stubbed. Usage: start `npx next start -p 3100`, then
# `python3 .claude/checks/ask-e2e.py <screenshot dir>`. Needs Python Playwright (Chromium in /opt/pw-browsers).
import json, re, sys
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
B="http://localhost:3100"; OUT=sys.argv[1]
KEYS={"OpenAI":"sk-openai-AAAA1111","Claude":"sk-ant-BBBB2222","Gemini":"AIzaCCCC3333xx","Perplexity":"pplx-DDDD4444"}
ORKEY="sk-or-v1-EEEE5555ffff"
HOSTS={"OpenAI":"api.openai.com","Claude":"api.anthropic.com","Gemini":"generativelanguage.googleapis.com","Perplexity":"api.perplexity.ai"}
lists={"OpenAI":["Joe's Pizza","Di Fara","Lucali","Prince Street","L'Industrie"],
 "Claude":["Di Fara","Joe's Pizza","L'Industrie","Lucali","Scarr's"],
 "Gemini":["Joe's Pizza","Lucali","Di Fara","Patsy's","Juliana's"]}
results=[]; ok=lambda name,cond,detail="": results.append((name,bool(cond),detail))

def body_for(host, lst):
    text="\n".join(f"{i+1}. {x}" for i,x in enumerate(lst))
    if "anthropic" in host: return {"content":[{"type":"text","text":text}]}
    if "googleapis" in host: return {"candidates":[{"content":{"parts":[{"text":text}]}}]}
    return {"choices":[{"message":{"content":text}}]}

with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- A: provider keys ----------
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page(); reqs=[]; csp=[]
    pg.on("request", lambda r: reqs.append({"url":r.url,"headers":r.headers,"body":r.post_data or ""}))
    pg.on("console", lambda m: csp.append(m.text) if "Content Security Policy" in m.text or m.type=="error" else None)
    def provider(route):
        host=urlparse(route.request.url).hostname
        model=[m for m,h in HOSTS.items() if h==host][0]
        if model=="Perplexity": return route.fulfill(status=401, body='{"error":"bad key"}', headers={"access-control-allow-origin":"*"})
        route.fulfill(status=200, content_type="application/json", body=json.dumps(body_for(host, lists[model])), headers={"access-control-allow-origin":"*"})
    for h in HOSTS.values(): pg.route(f"https://{h}/**", provider)
    pg.goto(B+"/ask", wait_until="networkidle")
    base=len(reqs)
    pg.get_by_label("Question", exact=True).fill("Best pizza in New York")
    pg.get_by_role("button", name="Use your own provider keys instead").click()
    for m,k in KEYS.items(): pg.get_by_label(f"{m} API key").fill(k)
    pg.get_by_role("button", name="Ask", exact=True).click()
    pg.wait_for_selector("text=Every pick", timeout=15000); pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/keys-390.png", full_page=True)
    after=reqs[base:]
    for m,k in KEYS.items():
        carriers=[r for r in after if k in json.dumps(r)]
        ok(f"{m} key only to its host", carriers and all(urlparse(r["url"]).hostname==HOSTS[m] for r in carriers), [r["url"] for r in carriers])
    ok("no request to Gallop origin carries a key", not any(urlparse(r["url"]).hostname=="localhost" and any(k in json.dumps(r) for k in KEYS.values()) for r in after))
    ok("no request to any other host", all(urlparse(r["url"]).hostname in HOSTS.values() or urlparse(r["url"]).hostname=="localhost" for r in after), sorted({urlparse(r['url']).hostname for r in after}))
    txt=pg.inner_text("main")
    ok("three #1 picks shown", txt.count("Joe’s Pizza")>=1 and "Di Fara" in txt)
    ok("summary sentence", "Two of three put Joe’s Pizza first. Claude says Di Fara." in txt, re.findall(r"[^.]*put[^.]*\.[^.]*\.", txt)[:1])
    ok("perplexity error is actionable", "The key was rejected" in txt)
    html=pg.content()
    ok("no key in the page HTML", not any(k in html for k in KEYS.values()))
    ok("progress line", "3 of 4 answered. 1 didn’t, see why below." in txt, re.findall(r"\d of \d answered[^\n]*", txt))
    store=pg.evaluate("({ls: JSON.stringify(localStorage), ss: JSON.stringify(sessionStorage), ck: document.cookie, url: location.href})")
    ok("nothing stored", not any(k in json.dumps(store) for k in KEYS.values()), store)
    ok("no overflow 390", pg.evaluate("document.documentElement.scrollWidth-innerWidth")==0)
    pg.reload(wait_until="networkidle")
    pg.get_by_role("button", name="Use your own provider keys instead").click()
    vals=[pg.get_by_label(f"{m} API key").input_value() for m in KEYS]
    ok("reload empties keys", vals==["","","",""], vals)
    ok("no CSP violations or console errors (keys)", not [c for c in csp if "401" not in c], csp[:3])
    ctx.close()

    # ---------- B: OpenRouter connect + custom lanes ----------
    ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page(); reqs=[]; csp=[]; seen_state={}
    pg.on("request", lambda r: reqs.append({"url":r.url,"headers":r.headers,"body":r.post_data or ""}))
    pg.on("console", lambda m: csp.append(m.text) if m.type=="error" else None)
    def auth(route):
        q=parse_qs(urlparse(route.request.url).query); seen_state.update({k:v[0] for k,v in q.items()})
        route.fulfill(status=302, headers={"location": f"{B}/ask?code=CODE123&state={q['state'][0]}"})
    def keys_ex(route):
        body=json.loads(route.request.post_data); seen_state["exchange"]=body
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"key":ORKEY}), headers={"access-control-allow-origin":"*"})
    catalog={"data":[{"id":"meta-llama/llama-4-scout","name":"Meta: Llama 4 Scout","pricing":{"prompt":"0.0000001","completion":"0.0000003"},"architecture":{"output_modalities":["text"]}},
                     {"id":"anthropic/claude-haiku-4.5","name":"Anthropic: Claude Haiku 4.5","pricing":{"prompt":"0.000001","completion":"0.000005"}}]}
    def models(route): route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog), headers={"access-control-allow-origin":"*"})
    def chat(route):
        m=json.loads(route.request.post_data)["model"]
        if m=="google/gemini-3.5-flash-lite": return route.fulfill(status=404, body="{}", headers={"access-control-allow-origin":"*"})
        if m=="perplexity/sonar": return route.fulfill(status=200, content_type="application/json", body=json.dumps({"choices":[{"message":{"content":"1. <img src=x onerror=window.__pwned=1>\n2. Lucali"}}]}), headers={"access-control-allow-origin":"*"})
        lst=["Joe's Pizza","Di Fara","Lucali"] if "llama" not in m else ["Lucali","Joe's Pizza","Scarr's"]
        route.fulfill(status=200, content_type="application/json", body=json.dumps(body_for("openrouter",lst)), headers={"access-control-allow-origin":"*"})
    pg.route("https://openrouter.ai/auth*", auth)
    pg.route("https://openrouter.ai/api/v1/auth/keys", keys_ex)
    pg.route("https://openrouter.ai/api/v1/models", models)
    pg.route("https://openrouter.ai/api/v1/chat/completions", chat)
    pg.goto(B+"/ask", wait_until="networkidle")
    pg.get_by_label("Question", exact=True).fill("Carried over?")
    pg.get_by_role("radio", name="Top 10").check(force=True)
    pg.get_by_role("button", name="Connect OpenRouter").click()
    pg.wait_for_selector("text=Connected to OpenRouter.", timeout=15000)
    ok("callback url scrubbed", pg.url==B+"/ask", pg.url)
    ok("exchange used S256 verifier", seen_state.get("exchange",{}).get("code")=="CODE123" and len(seen_state["exchange"].get("code_verifier",""))>=43)
    ss=pg.evaluate("JSON.stringify(sessionStorage)")
    ok("pkce stash removed, key never stored", ORKEY not in ss and "verifier" not in ss, ss)
    ok("question carried across redirect", pg.get_by_label("Question", exact=True).input_value()=="Carried over?" and pg.get_by_role("radio", name="Top 10").is_checked())
    pg.get_by_label("Question", exact=True).fill("Best pizza in New York")
    pg.get_by_role("radio", name="Top 3").check(force=True)
    pg.get_by_role("button", name="Add a model").click()
    pg.get_by_label("Search models").fill("llama")
    pg.get_by_role("button", name=re.compile("Llama 4 Scout")).click()
    pg.get_by_role("button", name="Ask", exact=True).click()
    pg.wait_for_selector("text=Every pick", timeout=15000); pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/openrouter-1440.png", full_page=True)
    chats=[r for r in reqs if r["url"].endswith("/chat/completions")]
    ok("five lanes asked", len(chats)==5, len(chats))
    ok("OpenRouter key only to openrouter.ai", all(urlparse(r["url"]).hostname=="openrouter.ai" for r in reqs if ORKEY in json.dumps(r)))
    ok("top 3 requested", all("top 3" in r["body"] for r in chats))
    caps=[(json.loads(r["body"])["model"], json.loads(r["body"]).get("max_tokens")) for r in chats]
    ok("caps on every call", all(c==(1000 if m.startswith("google/gemini") else 400) for m,c in caps), caps)
    txt=pg.inner_text("main")
    ok("xss shown as text, not run", "<img src=x onerror=window.__pwned=1>" in txt and pg.evaluate("window.__pwned")!=1)
    ok("404 model error", "That model wasn’t found" in txt)
    ok("custom lane in results", "Llama 4 Scout" in txt)
    ok("no CSP violations (openrouter)", not [c for c in csp if "Content Security Policy" in c], csp[:3])
    pg.get_by_role("button", name="Disconnect").click()
    ok("disconnect", "Disconnected." in pg.inner_text("main") and not pg.query_selector("text=Every pick"))
    ctx.close()

    # ---------- C: forged callback ----------
    ctx=b.new_context(); pg=ctx.new_page()
    pg.goto(B+"/ask?code=EVIL&state=whatever", wait_until="networkidle"); pg.wait_for_timeout(500)
    ok("forged callback rejected", "expired or came from somewhere else" in pg.inner_text("main") and "code=" not in pg.url)
    ctx.close()
    # ---------- D: home + ask desktop screenshots ----------
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True); pg=ctx.new_page()
    pg.goto(B+"/ask", wait_until="networkidle"); pg.screenshot(path=f"{OUT}/ask-390.png", full_page=True)
    sm=pg.evaluate("""[...document.querySelectorAll('a,button,summary,label:has(input[type=radio])')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).map(e=>e.textContent.trim().slice(0,24)+':'+Math.round(e.getBoundingClientRect().height))""")
    ok("ask touch targets", sm in ([],["Skip to content:1"]), sm)
    ok("ask no overflow", pg.evaluate("document.documentElement.scrollWidth-innerWidth")==0)
    ctx.close()
import urllib.request
h=urllib.request.urlopen(B+"/ask").headers
ok("COOP on /ask", h.get("Cross-Origin-Opener-Policy")=="same-origin")
ok("nonce CSP on /ask", "nonce-" in (h.get("Content-Security-Policy") or ""))
req=urllib.request.Request(B+"/ask", headers={"purpose":"prefetch"})
ok("nonce CSP on prefetch", "nonce-" in (urllib.request.urlopen(req).headers.get("Content-Security-Policy") or ""))
for path in ["/", "/ASK", "/q/burger-sf"]:
    try: hh=urllib.request.urlopen(B+path).headers
    except urllib.error.HTTPError as e: hh=e.headers
    ok(f"static CSP on {path}", "unsafe-inline" in (hh.get("Content-Security-Policy") or ""))
html=urllib.request.urlopen(B+"/ask").read().decode()
ok("/ask has its own og:title", 'property="og:title" content="Ask your own | Gallop"' in html)

# ---------- E: six lanes on a phone, stuck-run fix ----------
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True); pg=ctx.new_page()
    ids=[f"vendor{i}/model-{i}" for i in range(6)]
    cat={"data":[{"id":i,"name":f"Long Model Name {n}","pricing":{"prompt":"0.000001","completion":"0.000002"}} for n,i in enumerate(ids)]}
    pg.route("https://openrouter.ai/auth*", lambda r: r.fulfill(status=302, headers={"location": f"{B}/ask?code=C&state={parse_qs(urlparse(r.request.url).query)['state'][0]}"}))
    pg.route("https://openrouter.ai/api/v1/auth/keys", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps({"key":ORKEY}), headers={"access-control-allow-origin":"*"}))
    pg.route("https://openrouter.ai/api/v1/models", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps(cat), headers={"access-control-allow-origin":"*"}))
    def chat6(r):
        m=json.loads(r.request.post_data)["model"]; k=ids.index(m) if m in ids else 0
        lst=[f"Place {(k+j)%8}" for j in range(5)]
        r.fulfill(status=200, content_type="application/json", body=json.dumps(body_for("openrouter",lst)), headers={"access-control-allow-origin":"*"})
    pg.route("https://openrouter.ai/api/v1/chat/completions", chat6)
    pg.goto(B+"/ask", wait_until="networkidle")
    pg.get_by_role("button", name="Connect OpenRouter").click(); pg.wait_for_selector("text=Connected to OpenRouter.")
    for _ in range(4): pg.get_by_role("button", name=re.compile("^Remove")).first.click()
    pg.get_by_role("button", name="Add a model").click()
    for i in range(6):
        pg.get_by_role("button", name=re.compile(f"Long Model Name {i}")).click()
    pg.get_by_label("Question", exact=True).fill("Best pizza in New York")
    pg.get_by_role("button", name="Ask", exact=True).click()
    pg.wait_for_selector("text=Every pick", timeout=15000); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/six-390.png", full_page=True)
    ok("six lanes: no page overflow", pg.evaluate("document.documentElement.scrollWidth-innerWidth")==0)
    ok("six lanes: table scrolls in its region", pg.evaluate("(()=>{const r=document.querySelector('[role=region]');return !!r && r.scrollWidth>r.clientWidth})()"))
    ctx.close(); b.close()

# ---------- F: answers and lane labels named like Object.prototype members ----------
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(); pg=ctx.new_page(); errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    proto={"OpenAI":["constructor","hasOwnProperty","A"],"Claude":["toString","__proto__","A"],"Gemini":["valueOf","A","B"]}
    def proto_route(route):
        host=urlparse(route.request.url).hostname; model=[m for m,h in HOSTS.items() if h==host][0]
        route.fulfill(status=200, content_type="application/json", body=json.dumps(body_for(host, proto[model])), headers={"access-control-allow-origin":"*"})
    for h in list(HOSTS.values())[:3]: pg.route(f"https://{h}/**", proto_route)
    pg.goto(B+"/ask", wait_until="networkidle")
    pg.get_by_label("Question", exact=True).fill("Rank JS object methods")
    pg.get_by_role("button", name="Use your own provider keys instead").click()
    for m in ["OpenAI","Claude","Gemini"]: pg.get_by_label(f"{m} API key").fill(KEYS[m])
    pg.get_by_role("button", name="Ask", exact=True).click()
    pg.wait_for_selector("text=Every pick", timeout=15000)
    t=pg.inner_text("main")
    ok("prototype-named answers render", "constructor" in t and "toString" in t and "hasOwnProperty" in t and not errs, errs[:2])
    ctx.close(); b.close()

for n,c,d in results: print(("PASS " if c else "FAIL ")+n+("" if c else f"  {d}"))
