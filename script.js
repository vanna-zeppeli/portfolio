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
