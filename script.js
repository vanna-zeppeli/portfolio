gsap.registerPlugin(ScrollTrigger);

const track = document.querySelector(".horizontal-track");

// Fungsi menghitung jarak geser yang benar-benar pas
const getScrollAmount = () => {
    return track.scrollWidth - window.innerWidth;
};

// ========================================================
// PIN + GESER TRACK
// ========================================================
gsap.to(track, {
    x: () => -getScrollAmount(),
    ease: "none",
    scrollTrigger: {
        trigger: ".horizontal-scroll-container",
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => "+=" + getScrollAmount(),
        invalidateOnRefresh: true,
        anticipatePin: 1
    }
});

// Posisi ikon melingkar di belakang foto
const orbitItems = document.querySelectorAll(".orbit-ring .orbit-item");
const orbitRadius = 170;

orbitItems.forEach((item, i) => {
    const angle = (360 / orbitItems.length) * i;
    const rad = angle * (Math.PI / 180);
    const x = Math.cos(rad) * orbitRadius;
    const y = Math.sin(rad) * orbitRadius;
    item.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    const face = item.querySelector(".orbit-face");
    face.style.transform = `rotate(${angle + 90}deg)`;
});
