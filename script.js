// 1. Initialize Lenis (Fixed Stutter by syncing solely with GSAP)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
});

gsap.registerPlugin(ScrollTrigger);

// Connect Lenis to GSAP strictly
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0); // Prevents GSAP from jumping on CPU spikes

// Route all nav anchor clicks through Lenis so smooth scroll is preserved
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
});

// 2. Custom Cursor & Ambient Orb Logic
const cursor = document.getElementById('cursor');
const cursorAura = document.getElementById('cursor-aura');
const ambientOrb = document.getElementById('ambient-orb');

// Track mouse position smoothly
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
let auraX = mouseX;
let auraY = mouseY;
let orbX = mouseX;
let orbY = mouseY;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Cursor animation loop
function updateCursor() {
    // Quick dot
    cursorX += (mouseX - cursorX) * 0.5;
    cursorY += (mouseY - cursorY) * 0.5;
    cursor.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;

    // Sluggish aura
    auraX += (mouseX - auraX) * 0.15;
    auraY += (mouseY - auraY) * 0.15;
    cursorAura.style.transform = `translate(calc(${auraX}px - 50%), calc(${auraY}px - 50%))`;

    // Extremely sluggish ambient orb
    orbX += (mouseX - orbX) * 0.05;
    orbY += (mouseY - orbY) * 0.05;
    ambientOrb.style.transform = `translate(${orbX}px, ${orbY}px)`;

    requestAnimationFrame(updateCursor);
}
// Start if not on mobile
if (window.innerWidth > 768) {
    updateCursor();
}

// Cursor Hover States
const hoverElements = document.querySelectorAll('[data-cursor-hover]');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// 3. GSAP Animations

// Preloader out
const tlPreloader = gsap.timeline();
tlPreloader.to('.preloader-counter', {
    innerText: 100,
    duration: 1.5,
    snap: { innerText: 1 },
    ease: "power2.inOut"
})
    .to('.preloader', {
        yPercent: -100,
        duration: 1,
        ease: "power4.inOut"
    })
    .from('.hero-label', { y: 20, opacity: 0, duration: 1 }, "-=0.2")
    .from('.hero-title .line', {
        y: 150,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "power4.out"
    }, "-=0.8");

// 4 & 5. Master Unified Transition (Clip-Path Wipe + Horizontal Scroll)
const zoomSvgText = document.getElementById('zoom-text-element');
const horizontalWrapper = document.querySelector('.horizontal-scroll-wrapper');

// Skills section starts parked below the viewport — clipped by overflow:hidden on the container.
// It slides up onto the black circle background, giving the feel of content
// naturally rising onto the solid dark canvas.
gsap.set('.horizontal-scroll-container', { y: '100%' });

const masterTl = gsap.timeline({
    scrollTrigger: {
        trigger: ".unified-transition",
        start: "top top",
        end: () => `+=${window.innerHeight * 2.5 + horizontalWrapper.scrollWidth}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
    }
});

// Phase 1: WORK text scales up toward the O — viewer feels pulled into the letter.
masterTl.to(zoomSvgText, {
    scale: 12,
    transformOrigin: '45% 50%',
    ease: 'power3.in',
    duration: 2
}, 0);

// Phase 2: Circle expands from the O outward — pure clip-path, no background tween.
// The circle itself IS the black. Nothing goes dark prematurely.
masterTl.to('.zoom-wipe', {
    clipPath: 'circle(150% at 45% 50%)',
    ease: 'power3.in',
    duration: 2
}, 0);

// Phase 3: Circle fully covers the viewport. Snap section bg and remove SVG.
// Both are invisible operations since the circle already covers everything.
masterTl.set('.unified-transition', { backgroundColor: 'var(--md-sys-color-on-background)' }, 2.0);
masterTl.set('.zoom-section', { display: 'none' }, 2.0);

// Phase 4: Skills section slides up from below onto the solid black background.
// Feels like the content is scrolling onto the dark canvas naturally.
masterTl.to('.horizontal-scroll-container', {
    y: 0,
    ease: 'power2.out',
    duration: 0.5
}, 2.0);

// Phase 5: Horizontal scroll through the skills cards.
masterTl.to(horizontalWrapper, {
    x: () => -(horizontalWrapper.scrollWidth - window.innerWidth),
    ease: 'none',
    duration: () => horizontalWrapper.scrollWidth / window.innerHeight
}, 2.5);

// 5. Standard Reveal Animations
const revealTexts = document.querySelectorAll('.reveal-text');
revealTexts.forEach(text => {
    gsap.from(text, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: text,
            start: "top 85%"
        }
    });
});

gsap.from('.contact-inner > *', {
    y: 60,
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    ease: "power4.out",
    scrollTrigger: {
        trigger: ".contact",
        start: "top 70%"
    }
});
