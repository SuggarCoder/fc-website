# Mobile Responsive Optimization TODO

## Priority: CRITICAL

### 1. Enable Mobile Detection
- **File:** `src/App.tsx:138`
- **Current:** `const isMobile = false;` (hardcoded)
- **Fix:** Implement actual device detection + responsive signal
  ```ts
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);
  // Update on resize
  ```
- **Impact:** Unlocks all existing mobile configs (floor, lines)

### 2. Camera FOV Responsive (参考 source.js)
- **File:** `src/scene/createCamera.ts`, `src/App.tsx` (handleResize)
- **source.js 方案:** sm-down → FOV 65°, md-down → FOV 50°, desktop → 35°
- **Current:** Fixed FOV 35°
- **Fix:** Resize 时根据屏幕宽度动态更新 `camera.fov` + `updateProjectionMatrix()`

### 3. Renderer Pixel Ratio
- **File:** `src/scene/createRenderer.ts:13`
- **Current:** `renderer.setPixelRatio(2)` (hardcoded)
- **Fix:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- **source.js 方案:** 初始 2，性能不足时降级到 1.5 → 1

### 4. Mouse Parallax Touch 处理 (参考 source.js)
- **File:** `src/systems/createMouseParallax.ts`
- **Current:** 只监听 `mousemove`，mobile 无效
- **source.js 方案:** 检测 `hasHoverSupport()`，无 hover 则不启用 parallax
- **Fix:** 判断 touch 设备时跳过 parallax 初始化

---

## Priority: HIGH

### 5. App.tsx 文字缩放
- **File:** `src/App.tsx`
- **sec2/sec3/sec5:** `w-1/3` / `w-1/2` → mobile 应改为 `w-full` 或 `w-2/3`
- **sec4/sec6:** `w-[40%]` + `text-6xl` → mobile: `w-full` + `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
- **White Overlay:** `text-9xl` → `text-4xl sm:text-5xl md:text-7xl lg:text-9xl`
- **Contact text:** `text-3xl` → `text-lg md:text-2xl lg:text-3xl`

### 6. Drawer 菜单字体缩放
- **File:** `src/App.tsx` (panelRef 区域)
- **Current:** menu items `text-6xl` (60px), mobile 会溢出
- **Fix:** `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`

### 7. Nav Logo & Button 缩放
- **File:** `src/App.tsx` (nav 区域)
- **Current:** Logo 只有 `lg:w-20 lg:h-20`，mobile 无默认尺寸；按钮 `w-20 h-20` (80px) 过大
- **Fix:** `w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20`

### 8. Get Started 按钮
- **File:** `src/App.tsx`
- **Current:** `lg:w-80`，mobile 无宽度；`h-20` 过大
- **Fix:** `w-full sm:w-60 lg:w-80`，`h-14 md:h-16 lg:h-20`

---

## Priority: MEDIUM

### 9. Form.tsx Phone Dropdown 宽度
- **File:** `src/components/Form.tsx`
- **Current:** `w-72` (288px)，在 360px 手机上接近溢出
- **Fix:** `w-[calc(100vw-3rem)] sm:w-72 md:w-80`，确保不超出屏幕

### 10. White Overlay 内容布局
- **File:** `src/App.tsx` (whiteOverlayRef)
- **Current:** `p-8 lg:p-20`，Form 在 `flex-row` 无响应式
- **Fix:** 确保 `flex-col md:flex-row`（已有），padding 改 `p-4 sm:p-6 md:p-8 lg:p-20`

### 11. GooeyText Touch 支持
- **File:** `src/components/GooeyText.tsx`
- **Current:** 只有 `mousemove`，mobile 无交互
- **Fix:** 添加 `touchmove` / `pointermove` 事件监听

### 12. Description Box 高度
- **File:** `src/App.tsx`
- **Current:** `h-[30vh]` 固定
- **Fix:** `h-auto min-h-[20vh] md:h-[30vh]`

---

## Priority: LOW

### 13. Scroll System 滚动距离
- **File:** `src/systems/createScrollSystem.ts`
- **Current:** `end: '+=5000'` 固定
- **source.js 方案:** mobile 使用不同的 freeze points 和 SVH 总量
- **Fix:** 可根据 `isMobile` 调整为 `+=3500` (mobile) / `+=5000` (desktop)

### 14. Performance 降级策略 (参考 source.js)
- **source.js 方案:**
  - Mobile: 先移除 floor → 再降 pixelRatio 到 1.5
  - Desktop: 先降 pixelRatio → 移除 floor → 关 bloom → pixelRatio 到 1
- **Current:** 无降级策略
- **Fix:** 实现 FPS 监控 + 自动降级（后续优化）

### 15. Black Overlay Footer 文字换行
- **File:** `src/App.tsx` (blackOverlayRef footer)
- **Current:** `justify-between` 在窄屏可能挤压
- **Fix:** `flex-col items-center sm:flex-row sm:justify-between` + `text-center sm:text-left`

---

## 实施顺序建议

1. **第一批 (核心):** #1 → #2 → #3 → #4 (Three.js 相关，影响渲染)
2. **第二批 (布局):** #5 → #6 → #7 → #8 (文字/UI 缩放)
3. **第三批 (组件):** #9 → #10 → #11 → #12 (组件级修复)
4. **第四批 (优化):** #13 → #14 → #15 (性能和细节)
