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
const orbitRadiusNormal = 170;
const orbitRadiusHover = 200; // jarak "mental" sedikit saat hover, bukan kabur jauh

function positionOrbitItems(radius) {
    orbitItems.forEach((item, i) => {
        const angle = (360 / orbitItems.length) * i;
        const rad = angle * (Math.PI / 180);
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        item.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
}

// posisi awal (radius normal)
positionOrbitItems(orbitRadiusNormal);

// rotasi wajah ikon cukup diset sekali, statis (kompensasi rotasi ring)
orbitItems.forEach((item, i) => {
    const angle = (360 / orbitItems.length) * i;
    const face = item.querySelector(".orbit-face");
    face.style.transform = `rotate(${angle + 90}deg)`;
});

// ========================================================
// HOVER FOTO: negative radial ikut kursor + ikon orbit menjauh sedikit
// ========================================================
const fotoBox = document.querySelector(".img");
const fotoTrack = document.querySelector(".img-track");
const fotoNegative = document.querySelector(".foto-negative");
const negRadius = 60; // ukuran lingkaran area negative, dalam px

fotoBox.addEventListener("mouseenter", () => {
    positionOrbitItems(orbitRadiusHover);
});

fotoBox.addEventListener("mousemove", (e) => {
    // clip-path koordinatnya relatif ke elemen foto-negative itu sendiri,
    // jadi rect harus diambil dari foto-negative, bukan dari track/parent
    const rect = fotoNegative.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    fotoNegative.style.clipPath = `circle(${negRadius}px at ${x}px ${y}px)`;
});

fotoBox.addEventListener("mouseleave", () => {
    positionOrbitItems(orbitRadiusNormal);
    fotoNegative.style.clipPath = `circle(0px at 50% 50%)`;
});