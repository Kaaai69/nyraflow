# 🌀 Hero Scroll Animation Spec (GSAP + Canvas)

**Цель для AI-ассистента (Anti-gravity):**
Реализовать скролл-анимацию на основе раскадровки (Image Sequence) в Hero-секции строго по инструкциям из референсного видео.

## 1. Главные промты из видео-инструкции (Скормить в Anti-gravity)
Для генерации самой логики компонента используй этот промт:
> "Implement a smooth canvas-based scroll animation using the provided WebP frame sequence from the folder. The animation should be pinned to the Hero section using GSAP ScrollTrigger. As the user scrolls, render the image sequence on a 2D Canvas centered behind the typography. Use CSS mix-blend-mode: screen and keep the canvas background transparent/black. Maintain smooth scrubbing (scrub: 0.6) and ensure it unpins smoothly when entering the next section."

*Справочно (промт, который использовался для генерации самих кадров в Google Flow):*
> "A smooth, cinematic loop of a dark particle tunnel with glowing silver and white dots moving gradually towards the viewer, isolated on a pure pitch black background #000000. Fluid particle physics, clean motion, deep space aesthetic, 30fps."

## 2. Зонирование и ограничения (КРИТИЧНО)
- **НЕ растягивать на весь сайт!** Анимация должна работать только на первом экране (Hero).
- Hero-секция должна фиксироваться (`pin: true` в GSAP).
- Длина скролл-анимации (`end` в ScrollTrigger): `+=1800` или `+=2000` пикселей.
- По завершении анимации секция плавно открепляется (unpin), и пользователь скроллит сайт дальше в обычном режиме (к блоку Услуг/Кейсов).

## 3. Технические требования к реализации (HeroAnimation.jsx)
1. **Подготовка Image Sequence:**
   - Кадры лежат в `/public/animation/tunnel/`.
   - Имена файлов: от `ezgif-frame-001.webp` до `ezgif-frame-090.webp` (90 кадров).
2. **Настройка Canvas:**
   - Canvas позиционируется абсолютно (`position: absolute`, `z-index: 0`).
   - Обязательно применить CSS-класс `mix-blend-screen` (чтобы черный фон кадров #000000 исчез и слился с фоном сайта #0B0C0E).
   - Сделать клики "сквозными": `pointer-events: none`.
3. **Логика GSAP:**
   - Предзагрузить все 90 `.webp` изображений.
   - Использовать `gsap.to()` для анимации объекта `{ frame: 0 }` до `{ frame: 89 }`.
   - `snap: "frame"`, `ease: "none"`.
   - В событии `onUpdate` перерисовывать `canvas.getContext('2d').drawImage()`.
4. **Интеграция контента:**
   - Поверх анимации (на `z-index: 10`) располагается заголовок: *"Создаём digital-продукты, которые двигают бизнес вперёд"*.
