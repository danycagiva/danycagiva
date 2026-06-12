const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const desktopSkillsQuery = window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)');
const hasGsap = window.gsap && window.ScrollTrigger;

let lenis = null;

if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
}

if (!prefersReducedMotion && !isTouchLike && window.Lenis && hasGsap) {
    lenis = new Lenis({
        duration: 0.9,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(500, 33);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();

        if (lenis) {
            lenis.scrollTo(target, { duration: 1, easing: (t) => 1 - Math.pow(1 - t, 3) });
        } else {
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    });
});

const cursor = document.getElementById('cursor');
const cursorAura = document.getElementById('cursor-aura');
const ambientOrb = document.getElementById('ambient-orb');

if (!prefersReducedMotion && hasFinePointer && cursor && cursorAura && ambientOrb) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let auraX = mouseX;
    let auraY = mouseY;
    let orbX = mouseX;
    let orbY = mouseY;

    window.addEventListener('pointermove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }, { passive: true });

    const updateCursor = () => {
        cursorX += (mouseX - cursorX) * 0.45;
        cursorY += (mouseY - cursorY) * 0.45;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;

        auraX += (mouseX - auraX) * 0.14;
        auraY += (mouseY - auraY) * 0.14;
        cursorAura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;

        orbX += (mouseX - orbX) * 0.035;
        orbY += (mouseY - orbY) * 0.035;
        ambientOrb.style.transform = `translate3d(${orbX}px, ${orbY}px, 0)`;

        requestAnimationFrame(updateCursor);
    };

    requestAnimationFrame(updateCursor);

    document.querySelectorAll('[data-cursor-hover]').forEach((element) => {
        element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
        element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
    });
}

if (hasGsap && !prefersReducedMotion) {
    const tlPreloader = gsap.timeline();
    tlPreloader.to('.preloader-counter', {
        innerText: 100,
        duration: 0.8,
        snap: { innerText: 1 },
        ease: 'power2.out',
    })
        .to('.preloader', {
            yPercent: -100,
            duration: 0.7,
            ease: 'power3.inOut',
        })
        .from('.hero-label', { y: 20, opacity: 0, duration: 0.8 }, '-=0.1')
        .from('.hero-title .line', {
            y: 110,
            opacity: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: 'power3.out',
        }, '-=0.6');

    const zoomSection = document.querySelector('.zoom-section');
    const zoomSvg = document.getElementById('zoom-svg');
    const zoomSvgText = document.getElementById('zoom-text-element');
    const horizontalWrapper = document.querySelector('.horizontal-scroll-wrapper');

    const syncZoomOrigin = () => {
        if (!zoomSection || !zoomSvg || !zoomSvgText) return null;

        let svgPoint;

        try {
            const oBox = zoomSvgText.getExtentOfChar(1);
            svgPoint = zoomSvg.createSVGPoint();
            svgPoint.x = oBox.x + oBox.width / 2;
            svgPoint.y = oBox.y + oBox.height / 2;
        } catch (error) {
            const textBox = zoomSvgText.getBBox();
            svgPoint = zoomSvg.createSVGPoint();
            svgPoint.x = textBox.x + textBox.width * 0.38;
            svgPoint.y = textBox.y + textBox.height / 2;
        }

        const sectionBox = zoomSection.getBoundingClientRect();
        const screenMatrix = zoomSvg.getScreenCTM();
        if (!screenMatrix) return null;

        const screenPoint = svgPoint.matrixTransform(screenMatrix);
        const originX = screenPoint.x - sectionBox.left;
        const originY = screenPoint.y - sectionBox.top;

        zoomSection.style.setProperty('--zoom-origin-x', `${originX}px`);
        zoomSection.style.setProperty('--zoom-origin-y', `${originY}px`);

        return `${svgPoint.x} ${svgPoint.y}`;
    };

    if (desktopSkillsQuery.matches && zoomSvgText && horizontalWrapper) {
        gsap.set('.horizontal-scroll-container', { yPercent: 100 });
        gsap.set('.zoom-wipe', {
            xPercent: -50,
            yPercent: -50,
            scale: 0,
            transformOrigin: '50% 50%',
        });

        const getHorizontalDistance = () => Math.max(0, horizontalWrapper.scrollWidth - window.innerWidth);
        let zoomSvgOrigin = syncZoomOrigin();

        ScrollTrigger.addEventListener('refreshInit', () => {
            zoomSvgOrigin = syncZoomOrigin();
        });

        const masterTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.unified-transition',
                start: 'top top',
                end: () => `+=${window.innerHeight * 2.5 + getHorizontalDistance()}`,
                scrub: 0.5,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        masterTl.to(zoomSvgText, {
            scale: 10,
            svgOrigin: () => zoomSvgOrigin || syncZoomOrigin() || '500 200',
            ease: 'power3.in',
            duration: 2,
            force3D: true,
        }, 0);

        masterTl.to('.zoom-wipe', {
            scale: 2,
            ease: 'power3.in',
            duration: 2,
            force3D: true,
        }, 0);

        masterTl.set('.unified-transition', { backgroundColor: 'var(--md-sys-color-on-background)' }, 2);
        masterTl.set('.zoom-section', { autoAlpha: 0 }, 2);

        masterTl.to('.horizontal-scroll-container', {
            yPercent: 0,
            ease: 'power2.out',
            duration: 0.5,
            force3D: true,
        }, 2);

        masterTl.to(horizontalWrapper, {
            x: () => -getHorizontalDistance(),
            ease: 'none',
            duration: () => Math.max(1, horizontalWrapper.scrollWidth / window.innerHeight),
            force3D: true,
        }, 2.5);

        document.fonts?.ready.then(() => {
            zoomSvgOrigin = syncZoomOrigin();
            ScrollTrigger.refresh();
        });
    } else {
        document.querySelector('.zoom-section')?.remove();
        gsap.set('.horizontal-scroll-container, .horizontal-scroll-wrapper', { clearProps: 'all' });
    }

    document.querySelectorAll('.reveal-text').forEach((text) => {
        gsap.from(text, {
            y: 40,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
                once: true,
            },
        });
    });

    [
        ['.muzika-mockup-wrap', '.muzika-section', 'top 80%'],
        ['.muzika-text > *', '.muzika-section', 'top 75%'],
        ['.contact-inner > *', '.contact', 'top 70%'],
    ].forEach(([targets, trigger, start]) => {
        gsap.from(targets, {
            y: 50,
            opacity: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger, start, once: true },
        });
    });
} else {
    document.querySelector('.preloader')?.remove();
}
