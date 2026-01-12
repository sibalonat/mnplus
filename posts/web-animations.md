# Creating Beautiful Web Animations

**Published on January 3, 2026**

Animations bring websites to life, creating engaging and memorable user experiences. Let's explore how to create smooth, performant animations!

## Why Animations Matter

Good animations:

- Guide user attention
- Provide visual feedback
- Create emotional connections
- Enhance perceived performance
- Make interfaces feel responsive

## CSS Animations

### Transitions

Transitions animate property changes:

```css
.button {
  background: blue;
  transition: background 0.3s ease;
}

.button:hover {
  background: darkblue;
}
```

**Transition Properties:**

- `transition-property`: What to animate
- `transition-duration`: How long
- `transition-timing-function`: Animation curve
- `transition-delay`: When to start

### Keyframe Animations

For more complex animations:

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.element {
  animation: slideIn 0.5s ease-out;
}
```

### Animation Properties

```css
.element {
  animation-name: slideIn;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-delay: 0.2s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-fill-mode: forwards;
}

/* Shorthand */
.element {
  animation: slideIn 1s ease-in-out 0.2s infinite alternate forwards;
}
```

## Common Animation Patterns

### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}
```

### Slide In

```css
@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Scale

```css
@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Rotate

```css
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: rotate 1s linear infinite;
}
```

### Bounce

```css
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
```

## JavaScript Animations

### Using Web Animations API

Modern JavaScript animation:

```javascript
const element = document.querySelector(".box");

element.animate(
  [
    { transform: "translateX(0)", opacity: 1 },
    { transform: "translateX(100px)", opacity: 0.5 },
  ],
  {
    duration: 1000,
    easing: "ease-in-out",
    fill: "forwards",
  }
);
```

### Controlling Animations

```javascript
const animation = element.animate(keyframes, options);

// Control playback
animation.pause();
animation.play();
animation.reverse();
animation.cancel();

// Listen to events
animation.onfinish = () => {
  console.log("Animation complete!");
};
```

### RequestAnimationFrame

For custom animations:

```javascript
function animate() {
  // Update element position
  element.style.left = position + "px";
  position += 1;

  if (position < 300) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);
```

## Timing Functions

Control animation speed curves:

```css
/* Built-in functions */
.linear {
  animation-timing-function: linear;
}
.ease {
  animation-timing-function: ease;
}
.ease-in {
  animation-timing-function: ease-in;
}
.ease-out {
  animation-timing-function: ease-out;
}
.ease-in-out {
  animation-timing-function: ease-in-out;
}

/* Custom cubic-bezier */
.custom {
  animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## Performance Tips

### 1. Use Transform and Opacity

These properties are GPU-accelerated:

```css
/* Good - GPU accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Avoid - triggers layout/paint */
.element {
  left: 100px;
  background: red;
}
```

### 2. Use will-change

Hint to the browser about upcoming changes:

```css
.element {
  will-change: transform, opacity;
}
```

Don't overuse it - remove after animation:

```javascript
element.addEventListener("animationend", () => {
  element.style.willChange = "auto";
});
```

### 3. Reduce Animation Complexity

- Limit the number of animated elements
- Use simpler animations for mobile
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Practical Examples

### Loading Spinner

```css
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

### Hover Card Effect

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
```

### Staggered List Animation

```javascript
const items = document.querySelectorAll(".list-item");

items.forEach((item, index) => {
  item.style.animationDelay = `${index * 0.1}s`;
  item.classList.add("fade-in-up");
});
```

```css
.fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Scroll Animations

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate");
    }
  });
});

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  observer.observe(el);
});
```

## Animation Libraries

Popular libraries to consider:

1. **Anime.js**: Lightweight JavaScript animation library
2. **GSAP**: Professional-grade animation platform
3. **Framer Motion**: React animation library
4. **AOS**: Animate on scroll library
5. **Lottie**: Render After Effects animations

## Conclusion

Great animations enhance user experience without being distracting. Start with subtle animations and gradually add more as needed.

> "Animation is not the art of drawings that move but the art of movements that are drawn." - Norman McLaren

Remember: Less is often more. Make every animation purposeful!

## Resources

- [CSS Animation Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [cubic-bezier.com](https://cubic-bezier.com/) - Visual timing function tool

Keep animating! ✨
