"""
GRADSKOOL Load Test Suite
=========================
Tests all major API endpoints under concurrent load.

Usage:
  python3 load_test.py                        # default: 20 users, 10s
  python3 load_test.py --users 50 --duration 30
  python3 load_test.py --users 100 --duration 60 --base-url http://yourserver.com

Scenarios tested:
  1. Public endpoints (courses, exams, blog)
  2. Auth flow (register, login, token refresh)
  3. Student portal (dashboard, learn, quiz)
  4. Admin APIs (students, curriculum, analytics)
  5. Spike test (sudden 5x load increase)
  6. Endurance test (sustained load)
"""

import argparse
import concurrent.futures
import json
import os
import random
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

# ── CONFIG ────────────────────────────────────────────────────────────────────

BASE_URL   = "http://127.0.0.1:8000/api/v1"
ADMIN_EMAIL    = "admin@gradskool.com"
ADMIN_PASSWORD = "Admin@1234"
STUDENT_EMAIL  = "test@gradskool.com"
STUDENT_PASS   = "Test@1234"

EXAMS    = ["cat", "xat", "snap", "nmat"]
SECTIONS = ["cat-varc", "cat-dilr", "cat-qa"]

# ── DATA CLASSES ──────────────────────────────────────────────────────────────

@dataclass
class Result:
    endpoint:    str
    method:      str
    status:      int
    duration_ms: float
    error:       Optional[str] = None
    scenario:    str = "general"

@dataclass
class ScenarioStats:
    name:       str
    results:    list = field(default_factory=list)

    @property
    def total(self):       return len(self.results)
    @property
    def passed(self):      return sum(1 for r in self.results if 200 <= r.status < 400)
    @property
    def failed(self):      return sum(1 for r in self.results if r.status >= 400 or r.error)
    @property
    def errors(self):      return sum(1 for r in self.results if r.error)
    @property
    def durations(self):   return [r.duration_ms for r in self.results if not r.error]
    @property
    def avg_ms(self):      return statistics.mean(self.durations) if self.durations else 0
    @property
    def p95_ms(self):
        if not self.durations: return 0
        s = sorted(self.durations)
        return s[int(len(s) * 0.95)]
    @property
    def p99_ms(self):
        if not self.durations: return 0
        s = sorted(self.durations)
        return s[int(len(s) * 0.99)]
    @property
    def max_ms(self):      return max(self.durations) if self.durations else 0
    @property
    def min_ms(self):      return min(self.durations) if self.durations else 0
    @property
    def success_rate(self): return (self.passed / self.total * 100) if self.total else 0
    @property
    def rps(self):
        if not self.results: return 0
        span = self.results[-1].duration_ms - self.results[0].duration_ms
        return self.total / (span / 1000) if span > 0 else 0

# ── HTTP CLIENT ───────────────────────────────────────────────────────────────

class Client:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.lock  = threading.Lock()

    def request(self, method: str, path: str,
                data: Optional[dict] = None,
                scenario: str = "general") -> Result:
        url = BASE_URL + path
        start = time.perf_counter()
        try:
            headers = {"Content-Type": "application/json"}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"

            body = json.dumps(data).encode() if data else None
            req  = urllib.request.Request(url, data=body, headers=headers, method=method)

            with urllib.request.urlopen(req, timeout=10) as resp:
                elapsed = (time.perf_counter() - start) * 1000
                return Result(path, method, resp.status, elapsed, scenario=scenario)

        except urllib.error.HTTPError as e:
            elapsed = (time.perf_counter() - start) * 1000
            return Result(path, method, e.code, elapsed, scenario=scenario)
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            return Result(path, method, 0, elapsed,
                          error=type(e).__name__ + ": " + str(e)[:60],
                          scenario=scenario)

    def get(self, path, **kw):  return self.request("GET",  path, **kw)
    def post(self, path, data, **kw): return self.request("POST", path, data=data, **kw)

# ── TOKEN CACHE ───────────────────────────────────────────────────────────────

_token_cache = {}
_token_lock  = threading.Lock()

def get_token(email: str, password: str) -> Optional[str]:
    with _token_lock:
        if email in _token_cache:
            return _token_cache[email]
    try:
        url  = BASE_URL + "/auth/login/"
        data = json.dumps({"email": email, "password": password}).encode()
        req  = urllib.request.Request(url, data=data,
                                      headers={"Content-Type": "application/json"},
                                      method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            body  = json.loads(resp.read())
            token = body.get("access") or body.get("token", "")
            with _token_lock:
                _token_cache[email] = token
            return token
    except Exception as e:
        return None

# ── SCENARIO FUNCTIONS ────────────────────────────────────────────────────────

def scenario_public(results: list):
    """Public endpoints — no auth required."""
    c = Client()
    exam = random.choice(EXAMS)
    calls = [
        c.get("/courses/exams/"),
        c.get(f"/courses/exams/{exam}/"),
        c.get(f"/courses/exams/{exam}/plans/"),
        c.get("/courses/testimonials/"),
        c.get("/courses/homepage/"),
        c.get("/tools/"),
        c.get(f"/tools/cat-quant-practice/"),
    ]
    for r in calls:
        r.scenario = "public"
        results.append(r)


def scenario_auth_flow(results: list):
    """Auth flow — register + login + token refresh."""
    c = Client()
    # Test login
    r = c.post("/auth/login/",
               {"email": STUDENT_EMAIL, "password": STUDENT_PASS},
               scenario="auth")
    results.append(r)

    # Test token refresh if login succeeded
    if r.status == 200:
        try:
            url  = BASE_URL + "/auth/login/"
            data = json.dumps({"email": STUDENT_EMAIL, "password": STUDENT_PASS}).encode()
            req  = urllib.request.Request(url, data=data,
                                          headers={"Content-Type": "application/json"},
                                          method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                body    = json.loads(resp.read())
                refresh = body.get("refresh", "")
            if refresh:
                r2 = c.post("/auth/token/refresh/", {"refresh": refresh}, scenario="auth")
                results.append(r2)
        except: pass

    # Test invalid login
    r3 = c.post("/auth/login/",
                {"email": "wrong@email.com", "password": "wrong"},
                scenario="auth")
    results.append(r3)


def scenario_student_portal(results: list):
    """Student portal — dashboard, learn, progress."""
    token = get_token(STUDENT_EMAIL, STUDENT_PASS)
    if not token:
        results.append(Result("/auth/login/", "POST", 0, 0,
                               error="Auth failed", scenario="student"))
        return
    c = Client(token=token)
    exam = random.choice(EXAMS)

    calls = [
        c.get("/dashboard/summary/",                    scenario="student"),
        c.get("/dashboard/activity/",                   scenario="student"),
        c.get("/dashboard/performance/",                scenario="student"),
        c.get("/enrollments/access/",                   scenario="student"),
        c.get(f"/learn/{exam}/sections/",               scenario="student"),
        c.get("/courses/testimonials/",                 scenario="student"),
        c.get("/enrollments/programme-settings/",       scenario="student"),
        c.get("/enrollments/mock-credentials/",         scenario="student"),
    ]
    results.extend(calls)

    # Simulate browsing sections
    section = random.choice(SECTIONS)
    r = c.get(f"/learn/cat/sections/{section}/topics/", scenario="student")
    results.append(r)


def scenario_learn_portal(results: list):
    """Deep learn portal — topics, quiz, progress."""
    token = get_token(STUDENT_EMAIL, STUDENT_PASS)
    if not token: return
    c = Client(token=token)

    calls = [
        c.get("/learn/cat/sections/",                                      scenario="learn"),
        c.get("/learn/cat/sections/cat-varc/topics/",                      scenario="learn"),
        c.get("/learn/cat/sections/cat-varc/reading-comprehension-strategy-approach/", scenario="learn"),
        c.get("/learn/cat/recordings/",                                    scenario="learn"),
    ]
    results.extend(calls)


def scenario_admin_api(results: list):
    """Admin API endpoints."""
    token = get_token(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not token:
        # Try creating admin from test creds
        token = get_token(STUDENT_EMAIL, STUDENT_PASS)
    if not token: return
    c = Client(token=token)

    calls = [
        c.get("/dashboard/overview/",              scenario="admin"),
        c.get("/dashboard/analytics/?days=30",     scenario="admin"),
        c.get("/dashboard/students/",              scenario="admin"),
        c.get("/dashboard/curriculum/?exam=cat",   scenario="admin"),
        c.get("/dashboard/live-sessions/?exam=cat",scenario="admin"),
        c.get("/dashboard/coupons/",               scenario="admin"),
        c.get("/dashboard/announcement/",          scenario="admin"),
        c.get("/dashboard/orders/",                scenario="admin"),
        c.get("/dashboard/revenue/",               scenario="admin"),
        c.get("/dashboard/leads/",                 scenario="admin"),
        c.get("/dashboard/programmes/",            scenario="admin"),
    ]
    results.extend(calls)


def scenario_tools(results: list):
    """Free tools — no auth."""
    c = Client()
    calls = [
        c.get("/tools/",                                scenario="tools"),
        c.get("/tools/cat-quant-practice/",             scenario="tools"),
        c.get("/tools/cat-quant-practice/qa-topics/",   scenario="tools"),
        c.get("/tools/cat-quant-practice/questions/",   scenario="tools"),
        c.get("/tools/cat-rc-passages/passages/",       scenario="tools"),
        c.get("/tools/tags/",                           scenario="tools"),
    ]
    results.extend(calls)


def scenario_mixed(results: list):
    """Mixed realistic user behaviour."""
    roll = random.random()
    if roll < 0.40:   scenario_public(results)
    elif roll < 0.65: scenario_student_portal(results)
    elif roll < 0.80: scenario_learn_portal(results)
    elif roll < 0.90: scenario_tools(results)
    else:             scenario_auth_flow(results)

# ── LOAD RUNNER ───────────────────────────────────────────────────────────────

def run_load_test(users: int, duration: int,
                  scenario_fn=scenario_mixed,
                  ramp_up: int = 5) -> list:
    """
    Run concurrent users for `duration` seconds with `ramp_up` second warm-up.
    Returns list of Result objects.
    """
    all_results  = []
    results_lock = threading.Lock()
    stop_event   = threading.Event()

    def worker():
        while not stop_event.is_set():
            local = []
            try:
                scenario_fn(local)
            except Exception as e:
                local.append(Result("worker", "ERR", 0, 0,
                                    error=str(e)[:80], scenario="worker"))
            with results_lock:
                all_results.extend(local)
            time.sleep(random.uniform(0.05, 0.3))

    # Ramp up gradually
    threads = []
    users_per_wave = max(1, users // max(1, ramp_up))
    for wave in range(max(1, ramp_up)):
        wave_size = users_per_wave if wave < ramp_up - 1 else users - len(threads)
        for _ in range(wave_size):
            t = threading.Thread(target=worker, daemon=True)
            t.start()
            threads.append(t)
        if wave < ramp_up - 1:
            time.sleep(1)

    time.sleep(duration)
    stop_event.set()

    for t in threads:
        t.join(timeout=5)

    return all_results

# ── REPORTING ─────────────────────────────────────────────────────────────────

def print_results(all_results: list, test_name: str, duration: int, users: int):
    by_scenario = defaultdict(list)
    for r in all_results:
        by_scenario[r.scenario].append(r)

    # Overall
    total    = len(all_results)
    passed   = sum(1 for r in all_results if 200 <= r.status < 400)
    failed   = sum(1 for r in all_results if r.status >= 400)
    errors   = sum(1 for r in all_results if r.error)
    durs     = [r.duration_ms for r in all_results if not r.error and r.duration_ms > 0]
    avg      = statistics.mean(durs) if durs else 0
    p95      = sorted(durs)[int(len(durs)*0.95)] if durs else 0
    p99      = sorted(durs)[int(len(durs)*0.99)] if durs else 0
    rps      = total / duration if duration else 0

    W = 65
    print("\n" + "═"*W)
    print(f"  {test_name}")
    print(f"  {users} concurrent users · {duration}s duration")
    print("═"*W)

    print(f"\n  {'Metric':<30} {'Value':>15}")
    print(f"  {'-'*45}")
    print(f"  {'Total Requests':<30} {total:>15,}")
    print(f"  {'Successful (2xx/3xx)':<30} {passed:>15,}")
    print(f"  {'Failed (4xx/5xx)':<30} {failed:>15,}")
    print(f"  {'Network Errors':<30} {errors:>15,}")
    print(f"  {'Success Rate':<30} {passed/total*100:>14.1f}%")
    print(f"  {'Requests/sec':<30} {rps:>14.1f}")
    print(f"  {'Avg Response Time':<30} {avg:>13.0f}ms")
    print(f"  {'95th Percentile':<30} {p95:>13.0f}ms")
    print(f"  {'99th Percentile':<30} {p99:>13.0f}ms")
    print(f"  {'Max Response Time':<30} {max(durs) if durs else 0:>13.0f}ms")

    # By scenario
    print(f"\n  {'Scenario':<22} {'Reqs':>6} {'Pass':>6} {'Fail':>6} {'Err':>5} {'Avg':>8} {'P95':>8}")
    print(f"  {'-'*65}")
    for scenario, results in sorted(by_scenario.items()):
        s_total  = len(results)
        s_passed = sum(1 for r in results if 200 <= r.status < 400)
        s_failed = sum(1 for r in results if r.status >= 400)
        s_errors = sum(1 for r in results if r.error)
        s_durs   = [r.duration_ms for r in results if not r.error and r.duration_ms > 0]
        s_avg    = statistics.mean(s_durs) if s_durs else 0
        s_p95    = sorted(s_durs)[int(len(s_durs)*0.95)] if s_durs else 0
        icon     = "✓" if s_failed == 0 and s_errors == 0 else "✗"
        print(f"  {icon} {scenario:<20} {s_total:>6} {s_passed:>6} {s_failed:>6} {s_errors:>5} {s_avg:>7.0f}ms {s_p95:>7.0f}ms")

    # Slowest endpoints
    by_endpoint = defaultdict(list)
    for r in all_results:
        if not r.error:
            by_endpoint[r.endpoint].append(r.duration_ms)

    slowest = sorted(by_endpoint.items(), key=lambda x: statistics.mean(x[1]), reverse=True)[:8]
    print(f"\n  Slowest Endpoints:")
    print(f"  {'Endpoint':<45} {'Avg':>8} {'P95':>8} {'Count':>7}")
    print(f"  {'-'*68}")
    for endpoint, dlist in slowest:
        ep_avg = statistics.mean(dlist)
        ep_p95 = sorted(dlist)[int(len(dlist)*0.95)] if dlist else 0
        flag   = "🔴" if ep_avg > 500 else "🟡" if ep_avg > 200 else "🟢"
        print(f"  {flag} {endpoint:<43} {ep_avg:>7.0f}ms {ep_p95:>7.0f}ms {len(dlist):>7}")

    # Errors summary
    error_types = defaultdict(int)
    for r in all_results:
        if r.error:
            key = r.error.split(":")[0]
            error_types[key] += 1
        elif r.status >= 400:
            error_types[f"HTTP {r.status}"] += 1

    if error_types:
        print(f"\n  Error Breakdown:")
        for err, count in sorted(error_types.items(), key=lambda x: -x[1])[:8]:
            print(f"    {err}: {count}")

    # Performance grade
    print(f"\n  {'─'*W}")
    grade_issues = []
    if avg > 500:     grade_issues.append(f"avg response {avg:.0f}ms > 500ms target")
    if p95 > 1000:    grade_issues.append(f"P95 {p95:.0f}ms > 1000ms target")
    if passed/total < 0.95 if total else True:
        grade_issues.append(f"success rate {passed/total*100:.1f}% < 95% target")
    if errors/total > 0.05 if total else False:
        grade_issues.append(f"error rate {errors/total*100:.1f}% > 5%")

    if not grade_issues:
        print(f"  ✅ PASS — All performance targets met")
    else:
        print(f"  ⚠️  Issues:")
        for issue in grade_issues:
            print(f"     → {issue}")

    print("═"*W + "\n")
    return {'total': total, 'passed': passed, 'failed': failed,
            'errors': errors, 'avg_ms': avg, 'p95_ms': p95, 'rps': rps}


def check_server_up(base_url: str) -> bool:
    try:
        url = base_url.replace('/api/v1', '') + '/api/v1/courses/exams/'
        urllib.request.urlopen(url, timeout=5)
        return True
    except:
        return False


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='GRADSKOOL Load Test Suite')
    parser.add_argument('--users',    type=int, default=20,   help='Concurrent users')
    parser.add_argument('--duration', type=int, default=15,   help='Duration in seconds')
    parser.add_argument('--base-url', type=str, default=BASE_URL)
    parser.add_argument('--scenario', type=str, default='all',
                        choices=['all','public','auth','student','admin','tools','spike','endurance'])
    args = parser.parse_args()

    global BASE_URL
    BASE_URL = args.base_url

    print("\n" + "═"*65)
    print("  GRADSKOOL — LOAD TEST SUITE")
    print("  Checking server connection...")
    print("═"*65)

    if not check_server_up(BASE_URL):
        print(f"\n  ✗ Cannot reach {BASE_URL}")
        print("  Make sure the backend is running:")
        print("    cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000\n")
        sys.exit(1)

    print(f"  ✓ Server reachable at {BASE_URL}")
    print(f"  Config: {args.users} users · {args.duration}s · scenario={args.scenario}")

    all_test_results = {}

    # ── TEST SUITE ────────────────────────────────────────────────────────────

    if args.scenario in ('all', 'public'):
        print(f"\n  Running: PUBLIC ENDPOINTS ({args.users} users, {args.duration}s)...")
        results = run_load_test(args.users, args.duration, scenario_public, ramp_up=3)
        all_test_results['public'] = print_results(results, "TEST 1 — Public Endpoints", args.duration, args.users)

    if args.scenario in ('all', 'auth'):
        print(f"  Running: AUTH FLOW ({args.users} users, {args.duration}s)...")
        results = run_load_test(args.users, args.duration, scenario_auth_flow, ramp_up=3)
        all_test_results['auth'] = print_results(results, "TEST 2 — Auth Flow", args.duration, args.users)

    if args.scenario in ('all', 'student'):
        print(f"  Running: STUDENT PORTAL ({args.users} users, {args.duration}s)...")
        results = run_load_test(args.users, args.duration, scenario_student_portal, ramp_up=5)
        all_test_results['student'] = print_results(results, "TEST 3 — Student Portal", args.duration, args.users)

    if args.scenario in ('all', 'admin'):
        print(f"  Running: ADMIN APIs ({max(5,args.users//4)} users, {args.duration}s)...")
        results = run_load_test(max(5, args.users//4), args.duration, scenario_admin_api, ramp_up=2)
        all_test_results['admin'] = print_results(results, "TEST 4 — Admin APIs", args.duration, max(5,args.users//4))

    if args.scenario in ('all', 'tools'):
        print(f"  Running: FREE TOOLS ({args.users} users, {args.duration}s)...")
        results = run_load_test(args.users, args.duration, scenario_tools, ramp_up=3)
        all_test_results['tools'] = print_results(results, "TEST 5 — Free Tools", args.duration, args.users)

    if args.scenario in ('all', 'spike'):
        # Spike: normal load, then 5x spike for 5s, back to normal
        print(f"  Running: SPIKE TEST...")
        print(f"    Phase 1: {args.users} users for {args.duration//3}s")
        r1 = run_load_test(args.users, args.duration//3, scenario_mixed, ramp_up=2)
        print(f"    Phase 2: SPIKE {args.users*5} users for 5s")
        r2 = run_load_test(args.users*5, 5, scenario_public, ramp_up=1)
        print(f"    Phase 3: {args.users} users for {args.duration//3}s (recovery)")
        r3 = run_load_test(args.users, args.duration//3, scenario_mixed, ramp_up=2)
        all_test_results['spike'] = print_results(
            r1+r2+r3, "TEST 6 — Spike Test", args.duration, args.users*5)

    if args.scenario in ('endurance',):
        print(f"  Running: ENDURANCE TEST ({args.users} users, 120s)...")
        results = run_load_test(args.users, 120, scenario_mixed, ramp_up=10)
        all_test_results['endurance'] = print_results(
            results, "TEST 7 — Endurance (120s)", 120, args.users)

    # ── SUMMARY ───────────────────────────────────────────────────────────────
    if len(all_test_results) > 1:
        print("═"*65)
        print("  OVERALL SUMMARY")
        print("═"*65)
        total_req  = sum(v['total']  for v in all_test_results.values())
        total_pass = sum(v['passed'] for v in all_test_results.values())
        total_fail = sum(v['failed'] for v in all_test_results.values())
        total_err  = sum(v['errors'] for v in all_test_results.values())
        all_avgs   = [v['avg_ms'] for v in all_test_results.values() if v['avg_ms'] > 0]
        all_p95s   = [v['p95_ms'] for v in all_test_results.values() if v['p95_ms'] > 0]

        print(f"\n  Total requests:   {total_req:,}")
        print(f"  Total passed:     {total_pass:,} ({total_pass/total_req*100:.1f}%)")
        print(f"  Total failed:     {total_fail:,}")
        print(f"  Total errors:     {total_err:,}")
        print(f"  Avg response:     {statistics.mean(all_avgs):.0f}ms")
        print(f"  Avg P95:          {statistics.mean(all_p95s):.0f}ms")

        tests_passed = sum(1 for v in all_test_results.values()
                           if v['passed']/(v['total'] or 1) >= 0.95)
        print(f"\n  Tests passed:     {tests_passed}/{len(all_test_results)}")

        if tests_passed == len(all_test_results):
            print(f"\n  ✅ GRADSKOOL LOAD TEST: ALL TESTS PASSED")
        else:
            print(f"\n  ⚠️  GRADSKOOL LOAD TEST: {len(all_test_results)-tests_passed} TEST(S) NEED ATTENTION")
        print("═"*65 + "\n")


if __name__ == "__main__":
    main()
