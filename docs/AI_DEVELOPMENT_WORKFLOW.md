# PEDS — Quy trình phát triển, kiểm thử và xác minh nhánh rebuild

**Áp dụng:** repository `DB-Ducbao113/Podium-Effet-De-Sol`; branch làm việc `rebuild`.  
**Đối tượng:** ChatGPT coding workflows, OpenCode và các coding agent đọc được `AGENTS.md`.  
**Mục tiêu:** mỗi yêu cầu được triển khai có bằng chứng kiểm thử, kiểm tra bảo mật, review, QA và xác minh Git; không đánh đồng “AI đã sửa code” với “đã release an toàn”.

## 0. Nền tảng đã kiểm tra

- npm workspaces, yêu cầu Node.js 22+.
- `apps/web`: React + TypeScript + Vite + Three.js, Vitest; `apps/api`: Cloudflare Worker + Vitest; `packages/security`: validation + Vitest; `apps/jobs`: sync dữ liệu F1 chạy thủ công.
- Các lệnh thực có trong root `package.json`: `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `cloudflare:dry-run`, `security:secrets`, `security:assets`, `security:audit`, `verify`.
- CI tại `.github/workflows/ci.yml` đã chạy coverage và audit nhưng ở baseline chưa kích hoạt khi push trực tiếp lên `rebuild`. CI được bổ sung nhánh này trong bộ quy trình.
- `npm run verify` hiện **không** chạy `format:check`, `test:coverage` và `security:audit`. Không gọi riêng lệnh này là “đã kiểm tra mọi thứ”.
- Visual QA: có `tools/home-v9-visual-qa.mjs` (phụ thuộc Chrome địa phương, route Home V9). Đây không phải bộ end-to-end tự động bao phủ mọi trang.
- Đối chiếu thêm `DESIGN.md`, `docs/architecture.md`, `docs/security.md` và các QA reports lịch sử. Không dựa vào report cũ như kết quả kiểm thử của commit mới.

## 1. Luồng bắt buộc cho MỖI prompt thay đổi code

### G0 — Preflight: xác nhận nhánh, phạm vi và baseline

Chạy từ repository root:

```bash
node --version
git branch --show-current
git status --short
git rev-parse HEAD
git remote -v
git diff --check
```

- Current branch **phải là `rebuild`** trước khi sửa code. Nếu khác: dừng việc ghi file, thông báo chệch nhánh. Không tự checkout/reset/stash vì có thể phá thay đổi của người dùng.
- Ghi lại commit SHA, dirty working tree, file có sẵn thay đổi. Không ghi đè code do người khác đang sửa.
- Đọc feature, phụ thuộc, design/security boundaries; ghi 2–6 acceptance criteria có thể kiểm chứng.
- Chọn mức độ: `LOW` (docs/isolated styles), `MEDIUM` (UI/logic), `HIGH` (API, security, data, dependencies, build, routes, release). Mức HIGH yêu cầu security review và regression rộng.
- Chỉ chạy `npm ci` khi dependency chưa cài hoặc cần tái dựng lockfile; không tự thay đổi lockfile.

### G1 — Plan + test strategy

Mô tả trước khi sửa: mục tiêu, nguyên nhân/giả thuyết, file dự kiến, tests cần thêm, rủi ro, rollback concept. 
- Bug fix: có tái hiện hoặc failing regression trước khi sửa khi khả thi.
- Feature: test luồng hợp lệ, empty/loading/error, edge cases, boundary API và nhánh logic.
- CSS/UI: test tương tác nếu có logic; ngoài unit tests phải có browser QA.
- Refactor: ghi rõ hành vi cần giữ nguyên; test trước và sau, không thêm feature đồng thời.
- Security fix: thêm negative tests chứng minh tấn công/đầu vào xấu bị chặn.
- Performance: đo baseline trước khi tối ưu; không tuyên bố “nhanh hơn” nếu chưa có số đo.

### G2 — Implement: bản sửa nhỏ, không phá contract

- Ưu tiên sửa nhỏ nhất đáp ứng acceptance criteria, giữ module boundary như `docs/architecture.md`.
- Không đưa token lên `VITE_*`, log client, response body hoặc repository.
- API phải validation inputs, giới hạn độ dài/query, kiểm soát origin, timeout, cache/abuse protection và error messages.
- Không thay kết quả F1 thật bằng dữ liệu giả trong production; khi dữ liệu là placeholder phải ghi rõ.
- Không public hóa `.local-assets/`, `source-assets/`; kiểm tra license/provenance trước khi thêm asset.
- Kiểm soát effect cleanup, fetch race, navigation, loading, reduced motion, keyboard và 3D fallback khi sửa UI.
- Không chạy data-sync có ghi dữ liệu, deploy, migration, remote write hay `npm audit fix` khi không được yêu cầu.

### G3 — Debug có bằng chứng

1. Ghi **actual vs expected**, bước tái hiện và môi trường.
2. Đọc stack trace/log nguồn thật; xác định lớp lỗi (render/state/network/API/build/assets).
3. Thu hẹp nguyên nhân; không sửa nhiều chỗ đồng thời khi chưa có giả thuyết.
4. Thêm test thất bại cho root cause (nếu có thể).
5. Sửa; chạy targeted test; chạy lại đúng reproduction; kiểm tra lỗi phụ.
6. Ghi root cause, nguyên nhân vì sao test cũ bỏ sót và bằng chứng regression.

Không dùng `try/catch` để nuốt lỗi, `any` để che TypeScript error, hoặc bỏ assertion để biến RED thành GREEN.

### G4 — Self-review + maintainability

Review `git diff --check` và `git diff`; dùng độ nghiêm trọng:
- **P0**: rò rỉ bí mật, khai thác trực tiếp, mất dữ liệu, production break; BLOCK.
- **P1**: sai contract, kết quả dữ liệu không đúng, lỗi chức năng quan trọng, regression; BLOCK.
- **P2**: thiếu nhánh test, accessibility/performance có tác động đáng kể; cần sửa hoặc owner chấp thuận ngoại lệ có lý do.
- **P3**: naming, formatting, refactor tùy chọn; không tự mở rộng scope.

Checklist: logic/edge cases; boundary giữa packages; stale hooks/memory leak; error/loading state; null/undefined; security; deterministic tests; size of diff; no hidden behavior; docs/contracts. Ghi phát hiện kèm `file:line`, mức nghiêm trọng, điều kiện gây lỗi và cách chứng minh. Nếu không có phát hiện phải ghi đã review khu vực nào.

### G5 — Unit/integration/static checks

Chạy tại root, **không bỏ qua lỗi**:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run security:secrets
npm run security:assets
npm run security:audit
npm run build
npm run cloudflare:dry-run
git diff --check
```

- `npm run format:check` phải được kiểm tra và báo trạng thái. Nếu baseline chưa đạt, phân biệt lỗi mới với lỗi có trước; **không** format toàn bộ repo khi chỉ sửa 1 feature. Có thể chạy Prettier check riêng các file sửa.
- `npm run test:coverage` chạy coverage frontend và tests API/security theo script đã có, không có nghĩa là coverage API được đo bằng coverage tool. Báo đúng phạm vi thực tế.
- Focused test ví dụ: `npm run test --workspace=@peds/web -- src/components/championship/RaceCalendar.test.tsx`; chỉnh đường dẫn theo test thật. Sau targeted test vẫn cần full suite.
- Nếu phát hiện vulnerability mức HIGH/CRITICAL: BLOCK; chỉ cho ngoại lệ khi owner chấp thuận và có tài liệu rõ lý do, phạm vi, cách giảm thiểu.
- Không gán mức coverage tối thiểu giả định khi repo chưa cấu hình threshold. Khi phát triển module mới, đo/report branch/function coverage và đề xuất threshold sau khi có baseline.
- Nếu không chạy được vì môi trường, ghi `NOT RUN` cùng blocker; không đánh dấu PASS.

### G6 — Browser QA + accessibility

**Bắt buộc khi ảnh hưởng giao diện hoặc hành vi người dùng.** Chạy web local bằng `npm run dev` hoặc build preview, sau đó kiểm tra **trên trình duyệt thật**, không chỉ dựa trên ảnh tĩnh hoặc JSDOM.

Viewport đề nghị: 360×780, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080. Mỗi route bị ảnh hưởng kiểm tra:
- Main task flow, navigation/back/refresh/deep-link, các trạng thái loading/error/empty, API lỗi, data consistency.
- Không horizontal overflow/overlap; font, responsive images, sticky header, scrolling, dark overlays, Safari/Chrome nếu khả dụng.
- Console/page errors và network failures; phân biệt lỗi đã có trước và lỗi mới.
- Keyboard Tab/Enter/Escape, visible focus, semantic labels, alt, contrast và touch targets.
- `prefers-reduced-motion`, fallback nếu WebGL/3D không chạy hoặc thiết bị yếu; cảnh 3D không chặn nội dung chính.
- Screenshots/evidence trong thư mục untracked (ví dụ `.local-assets/qa/<feature>/`), ghi thiết bị/browser/route. Không đưa binary evidence lên repo nếu không được yêu cầu.

Với Home V9 cụ thể có thể dùng `CHROME_PATH=/path/to/chrome V9_URL=http://localhost:5173 node tools/home-v9-visual-qa.mjs`, nhưng xác minh route thực tế còn tồn tại trước khi dùng; không lấy script đó thay thế QA các trang khác.
Nếu không có browser hoặc Chrome: `BROWSER QA: NOT VERIFIED` và giữ task ở `HOLD` khi giao diện là acceptance criterion.

### G7 — Security + performance

Security review theo risk:
- XSS/HTML injection, DOM injection, URL navigation, CSP, CORS, CSRF (nếu phát sinh mutable API), SSRF, path traversal và unsafe file upload.
- Query allowlist, size limits, error leaks, rate limit, timeout, cache poisoning, malicious upstream, dependency CVEs.
- Public asset boundary, hard-coded secrets, license/provenance, third-party scripts, tokens in logs.
- Với thay đổi `apps/api` hoặc `packages/security`, test negative paths và cross-origin rejection, kiểm tra header và lỗi 4xx/5xx.

Performance:
- Đặt baseline đo ở cùng route/device/network trước và sau; chỉ tối ưu khi có bottleneck rõ.
- Theo dõi LCP, INP, CLS, JS bundles, unnecessary requests, 3D FPS/memory, loading waterfall; xem Web Vitals là mục tiêu đo, không là số đã đạt.
- Kiểm tra lazy loading/code-split, asset format, cache, model size, Three.js render loop cleanup và reduced-motion.
- Performance refactor phải giữ nguyên chức năng và chạy lại G5/G6.

### G8 — Xác minh nhánh rebuild **SAU chỉnh sửa cuối cùng**

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff
git rev-parse HEAD
git fetch --no-tags origin rebuild
git rev-parse origin/rebuild
git log --oneline --decorate -5
```

- Chỉ chạy `git fetch` sau khi được phép dùng remote/network; fetch không sửa working tree. Nếu mạng không có, đánh dấu remote `UNVERIFIED`.
- Phải phân biệt 3 đối tượng: (A) working-tree diff chưa commit, (B) HEAD local đã commit, (C) `origin/rebuild` trên GitHub. `git diff` có thể trống dù chưa push commit; dùng `git log origin/rebuild..HEAD --oneline` để phát hiện local commits chưa push.
- Nếu `HEAD != origin/rebuild` thì KHÔNG khẳng định đã kiểm tra bản remote mới nhất. Nếu có uncommitted changes, remote hiển nhiên chưa bao gồm thay đổi đó.
- Sau **khi được yêu cầu push**, đối chiếu SHA commit trên GitHub, kiểm tra GitHub Actions dành cho commit đó và kết luận `CI PASS / FAIL / PENDING / NOT RUN`. Có thể dùng `gh run list --branch rebuild --limit 5` và `gh run view <run-id> --log-failed` khi GitHub CLI đã được xác thực.
- Không được tự commit, push, merge, rebase, checkout hoặc deploy khi user chỉ yêu cầu sửa/test. Không làm sạch working tree bằng lệnh phá dữ liệu.
- CI xanh không thay thế browser/manual QA và remote production/Cloudflare preview. Không claim release khi chưa deploy và smoke test.

## 2. Ma trận chọn gate theo loại việc

| Loại công việc | Unit/integration | Full G5 | Browser G6 | Security G7 | Performance G7 |
| --- | --- | --- | --- | --- | --- |
| Bug logic | Regression bắt buộc | Có | Nếu user-visible | Theo vùng ảnh hưởng | Khi có thay đổi perf |
| New UI/UX | Test interaction/state | Có | **Bắt buộc** | Kiểm tra link/input/assets | Khi animation/3D/tải trang |
| API/security/data | Contract + negative tests | Có | Khi tích hợp UI | **Bắt buộc** | Cache/latency nếu liên quan |
| Refactor | Before/after tests | Có | Khi render bị ảnh hưởng | Khi boundary thay đổi | Không claim nếu chưa đo |
| Dependencies/build | Smoke + full regression | Có | Đối với client/build thay đổi | **Bắt buộc** | Bundle size nếu liên quan |
| Docs only | Không bắt buộc | Có thể rút gọn* | Không | Không | Không |

* Docs-only: `git diff --check`, kiểm tra link/tên file, Markdown và status branch; không nói đã chạy G5 nếu chưa chạy.

## 3. Điều kiện kết luận, tuyệt đối không suy diễn

- **IMPLEMENTED / HOLD:** code đã sửa nhưng một gate bắt buộc fail/not run.
- **LOCAL VERIFIED:** thay đổi đã qua static/tests/build/security và browser QA cần thiết trên local; chưa có bằng chứng remote.
- **REMOTE VERIFIED:** commit tương ứng thực sự có trên `origin/rebuild`, CI của chính SHA đó đã PASS, không còn thay đổi local chưa được bao gồm, các manual gates bắt buộc đã hoàn tất.
- **RELEASE VERIFIED:** bổ sung preview/production deployment và smoke test đã được cho phép và xác minh; mặc định KHÔNG đạt vì repo không có deployment workflow tự động.

Trạng thái `PASS` chỉ được dùng khi có command log/test result/screenshot thực tế. Không tự hợp thức hóa gate `NOT RUN`.

## 4. Mẫu báo cáo bắt buộc sau MỖI yêu cầu triển khai

```text
PEDS TASK QUALITY REPORT
Task:
Acceptance criteria: AC1 ..., AC2 ...
Risk: LOW / MEDIUM / HIGH
Branch expected/actual: rebuild / ...
Baseline HEAD: ...
Final local HEAD: ...
Remote origin/rebuild SHA: ... / UNVERIFIED
Working tree: clean / changes listed
Changed files: ...
Tests added/updated: ...
Checks (command -> PASS/FAIL/NOT RUN + counts/exit code):
  lint:
  typecheck:
  focused tests:
  full tests/coverage:
  secret/assets scans:
  npm audit:
  production build + Wrangler dry-run:
  format + diff check:
Browser QA: routes/viewports/browser/actions/console/screenshots OR NOT VERIFIED
Security findings: P0/P1/P2/P3, evidence / none observed
Performance before -> after: metrics OR NOT MEASURED
GitHub CI on exact SHA: PASS/FAIL/PENDING/NOT RUN
Remaining risks / exceptions:
Final: IMPLEMENTED / HOLD | LOCAL VERIFIED | REMOTE VERIFIED | RELEASE VERIFIED
```

Bất kỳ tiêu chí nghiệm thu nào chưa chứng minh được đều phải chỉ ra cụ thể, không ghi chung “all tests passed”.

## 5. OpenCode: lệnh có thể gọi trực tiếp

- `/peds-work <yêu cầu>` — triển khai yêu cầu, tự chạy các gate và cuối cùng kiểm tra `rebuild`.
- `/peds-test <phạm vi>` — lập test plan, tạo regression tests khi cần, chạy test và báo coverage.
- `/peds-debug <bug>` — tái hiện, root cause, regression và rerun.
- `/peds-review <phạm vi>` — code review ưu tiên P0–P2, không tự sửa trừ khi được giao.
- `/peds-refactor <phạm vi>` — refactor an toàn giữ nguyên behavior.
- `/peds-security <phạm vi>` — threat model, negative tests và scanners.
- `/peds-qa <route/flow>` — browser QA + accessibility/responsive.
- `/peds-optimize <bottleneck>` — đo baseline, tối ưu và đo lại.
- `/peds-finish` — kiểm tra toàn bộ thay đổi hiện tại, chạy gate và audit `rebuild` trước khi kết luận.

Các command định nghĩa ở `.opencode/commands/`; skill tái sử dụng `.opencode/skills/peds-quality-gates/SKILL.md`. Theo tài liệu OpenCode, lệnh tùy chỉnh chỉ chạy khi gọi; **AGENTS.md và CI** là lớp tự động/thực thi bổ sung, không phải một hook cưỡng chế chạy sau mọi tin nhắn.
