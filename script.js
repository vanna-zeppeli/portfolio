import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

gsap.registerPlugin(ScrollTrigger);

const track = document.querySelector(".horizontal-track");

// Fungsi menghitung jarak geser yang benar-benar pas
const getScrollAmount = () => {
    return track.scrollWidth - window.innerWidth;
};

// ========================================================
// 1. PIN + GESER TRACK (mekanisme lama, tidak berubah)
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

// ========================================================
// 2. SETUP SCENE THREE.JS UNTUK ASTRONOT 3D
// ========================================================
const wrap = document.querySelector("#astro-3d");
const canvas = document.querySelector("#astro-canvas");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Pencahayaan sederhana. keyLight = cahaya utama, rimLight = aksen dari belakang
// biar siluetnya kelihatan (biasa dipakai buat render karakter di background gelap).
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x88aaff, 1.4);
rimLight.position.set(-4, -1, -3);
scene.add(rimLight);

let astro = null;

// ---- GANTI PATH DI BAWAH INI KALAU SUDAH PUNYA ASSET 3D SENDIRI ----
// Sekarang masih pakai model astronot gratis (CC0) dari repo google/model-viewer,
// cuma sebagai placeholder. Ganti "aset-3d/Astronaut.glb" dengan file .glb kamu
// sendiri kalau sudah ada — sisa kode animasi di bawah nggak perlu diubah,
// asal strukturnya masih 1 objek utama (kalau modelnya rigged/beda skala,
// mungkin perlu sesuaikan astro.scale di bawah).
new GLTFLoader().load("aset-3d/Astronaut.glb", (gltf) => {
    astro = gltf.scene;
    scene.add(astro);
    renderLoop();
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Bantuan: ubah posisi layar (0-1, seperti xPercent/yPercent versi 2D dulu)
// jadi koordinat dunia 3D pada jarak/depth tertentu dari kamera.
function screenToWorld(xPercent, yPercent, depth) {
    const vFOV = (camera.fov * Math.PI) / 180;
    const distance = Math.abs(camera.position.z - depth);
    const height = 2 * Math.tan(vFOV / 2) * distance;
    const width = height * camera.aspect;
    return {
        x: (xPercent - 0.5) * width,
        y: -(yPercent - 0.5) * height
    };
}

// ========================================================
// 3. TITIK-TITIK POSISI ASTRONOT — INI YANG BISA KAMU ATUR SENDIRI
//
//    progress   : 0 = paling atas halaman (awal hero)
//                 1 = akhir section horizontal (card terakhir, "SERVICES")
//    xPercent   : posisi horizontal di layar, 0 = kiri, 1 = kanan
//    yPercent   : posisi vertikal di layar,   0 = atas, 1 = bawah
//    depth      : posisi Z di dunia 3D. 0 = dekat kamera (lebih besar),
//                 makin negatif = makin jauh/kecil
//    rotY       : rotasi menghadap kiri-kanan (radian). Karena modelnya
//                 satu mesh utuh (bukan rig dengan tulang leher terpisah),
//                 "menoleh" di sini = seluruh badan berputar di sumbu Y.
//                 Kalau nanti pakai model rigged dengan bone kepala,
//                 rotasi bisa dipindah ke bone itu saja untuk hasil lebih halus.
//    scale      : ukuran model
//
//    Tambah/kurangi titik sesuka hati, GSAP akan interpolasi otomatis
//    di antara titik-titik ini berdasarkan progress scroll.
// ========================================================
const WAYPOINTS = [
    { progress: 0.00, xPercent: 0.78, yPercent: 0.55, depth:  0.5, rotY: -0.3, scale: 0.9 },
    { progress: 0.35, xPercent: 0.18, yPercent: 0.45, depth: -1.0, rotY:  0.6, scale: 1.3 },
    { progress: 0.65, xPercent: 0.82, yPercent: 0.55, depth: -1.0, rotY: -0.6, scale: 1.3 },
    { progress: 1.00, xPercent: 0.85, yPercent: 0.40, depth:  0.2, rotY:  0.25, scale: 1.1 }
];

function lerp(a, b, t) { return a + (b - a) * t; }

function sampleWaypoints(t) {
    t = Math.min(Math.max(t, 0), 1);
    let i = 0;
    while (i < WAYPOINTS.length - 2 && t > WAYPOINTS[i + 1].progress) i++;
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const span = (b.progress - a.progress) || 1;
    const localT = (t - a.progress) / span;
    return {
        xPercent: lerp(a.xPercent, b.xPercent, localT),
        yPercent: lerp(a.yPercent, b.yPercent, localT),
        depth: lerp(a.depth, b.depth, localT),
        rotY: lerp(a.rotY, b.rotY, localT),
        scale: lerp(a.scale, b.scale, localT)
    };
}

let scrollProgress = 0; // di-update oleh ScrollTrigger di bagian 4
const clock = new THREE.Clock();
let looping = false;

function renderLoop() {
    if (looping) return;
    looping = true;

    const tick = () => {
        requestAnimationFrame(tick);
        if (!astro) return;

        const p = sampleWaypoints(scrollProgress);
        const world = screenToWorld(p.xPercent, p.yPercent, p.depth);

        // Idle floating tipis ("berombak-ombak") — jalan terus-menerus,
        // ditumpuk di atas posisi hasil scroll, jadi astronotnya tetap
        // hidup/bergerak halus walau scroll sedang diam.
        const t = clock.getElapsedTime();
        const bobY = Math.sin(t * 1.2) * 0.08;
        const swayRotZ = Math.sin(t * 0.9) * 0.04;
        const swayRotY = Math.sin(t * 0.6) * 0.05;

        astro.position.set(world.x, world.y + bobY, p.depth);
        astro.rotation.set(0, p.rotY + swayRotY, swayRotZ);
        astro.scale.setScalar(p.scale);

        renderer.render(scene, camera);
    };
    tick();
}

// ========================================================
// 4. SCROLLTRIGGER YANG MENGATUR scrollProgress
//    Rentangnya sengaja dibuat dari PALING ATAS halaman (bukan cuma dari
//    section horizontal), supaya astronot sudah ada & bergerak sejak hero,
//    lalu lanjut berpindah selama section horizontal, sesuai yang diminta.
// ========================================================
ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: () => "+=" + (window.innerHeight + getScrollAmount()),
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => { scrollProgress = self.progress; }
});

// ========================================================
// 5. ASTRONOT HANYA TERLIHAT DI HERO + SECTION HORIZONTAL.
//    Begitu masuk section "about", astronot fade-out dan MENETAP di posisi
//    terakhirnya (tidak snap balik / hilang tiba-tiba). Kalau scroll balik
//    ke atas, dia muncul lagi.
// ========================================================
ScrollTrigger.create({
    trigger: ".about",
    start: "top 85%",
    onEnter: () => gsap.to(wrap, { opacity: 0, duration: 0.5 }),
    onLeaveBack: () => gsap.to(wrap, { opacity: 1, duration: 0.5 })
});
