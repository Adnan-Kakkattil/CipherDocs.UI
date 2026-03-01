"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { graphqlRequest } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { GRAPHQL_URL } from "@/lib/config";

type LoginData = {
  login: {
    token: string;
    user: { id: string; username: string; email: string; isAdmin: boolean };
  };
};

type RegisterData = {
  register: {
    token: string;
    user: { id: string; username: string; email: string; isAdmin: boolean };
  };
};

function normalizeUsername(firstName: string, lastName: string, email: string) {
  const base =
    [firstName, lastName].filter(Boolean).join(".") ||
    (email.includes("@") ? email.split("@")[0] : email) ||
    "user";
  return base.toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export default function LandingPage() {
  const router = useRouter();

  const [threeLoaded, setThreeLoaded] = useState(false);
  const [lucideLoaded, setLucideLoaded] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [loginEmailOrUser, setLoginEmailOrUser] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("password");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const closeAll = () => {
    setLoginOpen(false);
    setRegisterOpen(false);
  };

  const internalNotes = useMemo(
    () => `<!--
Internal notes:
- Debug endpoints: /__debug/config /__debug/users /__debug/logs
- Internal admin API: /api/v1/internal/admin
- Debug header: X-Debug-Key = nvault_debug_2024_internal
- Internal API key: nvk_d56f1953e015cc01e79c84028089135d

Known issues (backlog):
- ENG-3456: JWT alg confusion hardening
- ENG-4892: XSLT injection surface review
- ENG-2892: Remove debug endpoints before next release
-->`,
    []
  );

  useEffect(() => {
    document.body.style.overflow = loginOpen || registerOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [loginOpen, registerOpen]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loginOpen, registerOpen]);

  useEffect(() => {
    if (!threeLoaded) return;
    const w = window as any;
    const THREE = w?.THREE;
    const container = document.getElementById("hero-canvas");
    if (!THREE || !container) return;

    container.innerHTML = "";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 15; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0xff6b00 : 0xffffff,
        transparent: true,
        opacity: 0.6,
        shininess: 100
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = (Math.random() - 0.5) * 8;
      cube.position.y = (Math.random() - 0.5) * 8;
      cube.position.z = (Math.random() - 0.5) * 4;
      cube.rotation.x = Math.random() * Math.PI;
      cube.rotation.y = Math.random() * Math.PI;
      const scale = 0.2 + Math.random() * 0.8;
      cube.scale.set(scale, scale, scale);
      cube.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.01
      };
      group.add(cube);
    }
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff6b00, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      group.children.forEach((child: any) => {
        child.rotation.x += child.userData.rotationSpeed;
        child.position.y += Math.sin(Date.now() * 0.001 + child.position.x) * 0.001;
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [threeLoaded]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("active");
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await graphqlRequest<LoginData>(
        `mutation Login($username:String!,$password:String!){ login(username:$username,password:$password){ token user { id username email isAdmin } } }`,
        { username: loginEmailOrUser, password: loginPassword }
      );
      setToken(data.login.token);
      setUser(data.login.user);
      closeAll();
      router.push("/dashboard");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const username = normalizeUsername(firstName, lastName, regEmail);
      const data = await graphqlRequest<RegisterData>(
        `mutation Register($username:String!,$email:String!,$password:String!){ register(username:$username,email:$email,password:$password){ token user { id username email isAdmin } } }`,
        { username, email: regEmail, password: regPassword }
      );
      setToken(data.register.token);
      setUser(data.register.user);
      closeAll();
      router.push("/dashboard");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      <Script
        src="https://unpkg.com/lucide@latest"
        strategy="afterInteractive"
        onLoad={() => setLucideLoaded(true)}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --brand-orange: #FF6B00;
          --brand-orange-light: #FFF5EE;
          --brand-dark: #1A1A1A;
        }
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          scroll-behavior: smooth;
          overflow-x: hidden;
        }
        .bg-orange-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF9E5E 100%);
        }
        .text-orange-primary { color: #FF6B00; }
        .bg-orange-primary { background-color: #FF6B00; }
        .border-orange-primary { border-color: #FF6B00; }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 0, 0.1);
        }
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        #hero-canvas {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 0;
          pointer-events: none;
        }
        .floating {
          animation: floating 3s ease-in-out infinite;
        }
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .modal {
          transition: opacity 0.3s ease;
          display: none;
        }
        .modal.open {
          display: flex;
        }
        `
        }}
      />

      <div dangerouslySetInnerHTML={{ __html: internalNotes }} />

      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <i data-lucide="shield-check" className="text-white w-6 h-6"></i>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Cipher<span className="text-orange-primary">Docs</span>
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
              <a href="#features" className="hover:text-orange-primary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-orange-primary transition-colors">
                How it Works
              </a>
              <a href="#pricing" className="hover:text-orange-primary transition-colors">
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setRegisterOpen(false);
                  setLoginOpen(true);
                }}
                className="px-5 py-2 text-gray-600 hover:text-orange-primary font-semibold transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setLoginOpen(false);
                  setRegisterOpen(true);
                }}
                className="px-6 py-2.5 bg-orange-primary text-white rounded-full font-semibold shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div id="hero-canvas" className="hidden lg:block w-1/2 h-full"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-primary text-sm font-bold mb-6 border border-orange-100">
              <span className="flex h-2 w-2 rounded-full bg-orange-primary animate-pulse"></span>
              Powered by Node.js & GraphQL
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-gray-900 mb-6">
              Secure Documents <br />
              <span className="text-orange-primary">Built for Speed.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
              The ultimate document management platform using end-to-end encryption. Scale your workspace
              with CipherDocs&apos; high-performance GraphQL API and enterprise storage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setRegisterOpen(true)}
                className="px-8 py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-300 hover:shadow-orange-400 transition-all flex items-center justify-center gap-2 group"
              >
                Start for Free
                <i data-lucide="arrow-right" className="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
              </button>
              <a
                href={GRAPHQL_URL}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-white border-2 border-orange-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
              >
                View API Docs
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 grayscale opacity-50">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg"
                alt="Node.js"
                className="h-8"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/1/17/GraphQL_Logo.svg"
                alt="GraphQL"
                className="h-8"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="uppercase tracking-widest text-xs font-bold text-orange-400 mb-10">
            Trusted by modern engineering teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-center opacity-40">
            <div className="text-2xl font-bold italic">TECHFLOW</div>
            <div className="text-2xl font-bold italic">NEXUS</div>
            <div className="text-2xl font-bold italic">CLOUD-X</div>
            <div className="text-2xl font-bold italic">DATALABS</div>
            <div className="hidden lg:block text-2xl font-bold italic">STREAMLINE</div>
          </div>
        </div>
      </section>

      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl font-bold mb-4">Enterprise Grade Infrastructure</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Every file is shredded, encrypted, and distributed across our high-performance Node infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl glass-card reveal hover:border-orange-400 transition-all group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-primary mb-6 group-hover:scale-110 transition-transform">
                <i data-lucide="zap" className="w-8 h-8"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4">GraphQL Powered</h3>
              <p className="text-gray-600">
                Query exactly what you need. Our GraphQL API ensures lightning-fast retrieval with zero over-fetching.
              </p>
            </div>
            <div className="p-8 rounded-3xl glass-card reveal hover:border-orange-400 transition-all group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-primary mb-6 group-hover:scale-110 transition-transform">
                <i data-lucide="lock" className="w-8 h-8"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4">End-to-End Encryption</h3>
              <p className="text-gray-600">
                Zero-knowledge architecture. Not even CipherDocs can access your data without your master key.
              </p>
            </div>
            <div className="p-8 rounded-3xl glass-card reveal hover:border-orange-400 transition-all group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-primary mb-6 group-hover:scale-110 transition-transform">
                <i data-lucide="share-2" className="w-8 h-8"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4">Seamless Sharing</h3>
              <p className="text-gray-600">
                Granular permissions with expiring links and password-protected sharing for external partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                Simplified Document <br /> <span className="text-orange-primary">Workflows.</span>
              </h2>

              <div className="space-y-8">
                <div className="flex gap-6 reveal">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-orange-500/30 flex items-center justify-center font-bold text-orange-primary">
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Drag & Drop Upload</h4>
                    <p className="text-gray-400">
                      Instantly upload files. Our Node engine handles multiple threads for massive batches.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 reveal">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-orange-500/30 flex items-center justify-center font-bold text-orange-primary">
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Automated Indexing</h4>
                    <p className="text-gray-400">
                      Metadata is automatically extracted and indexed for instant full-text search.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 reveal">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-orange-500/30 flex items-center justify-center font-bold text-orange-primary">
                    3
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Version Control</h4>
                    <p className="text-gray-400">
                      Keep track of every change. Roll back to any point in time with a single click.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative reveal">
              <div className="w-full aspect-square bg-orange-primary/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10 p-4 bg-gray-800 rounded-3xl border border-white/10 shadow-2xl floating">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono ml-4">api.cipherdocs.com/explorer</div>
                </div>
                <pre className="text-sm font-mono text-orange-300 leading-relaxed overflow-hidden">
<span className="text-blue-400">query</span> GetProjectFiles($id: <span className="text-yellow-400">ID!</span>) {"{"}
  project(id: $id) {"{"}
    name
    files(limit: 10) {"{"}
      filename
      size
      encryptedHash
      metadata {"{"}
        type
        lastModified
      {"}"}
    {"}"}
  {"}"}
{"}"}
                </pre>
                <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-white/5 text-xs text-green-400 font-mono">
                  // Result: 200 OK - 42ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl font-bold mb-4">Scalable Pricing</h2>
            <p className="text-gray-600">Start for free, upgrade as your team expands.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-10 rounded-3xl border border-gray-100 hover:shadow-2xl transition-all reveal bg-white">
              <h3 className="text-xl font-bold mb-2">Personal</h3>
              <div className="text-4xl font-extrabold mb-6">
                $0<span className="text-lg text-gray-400 font-normal">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> 5GB Storage
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Basic API Access
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Single User
                </li>
              </ul>
              <button
                onClick={() => setRegisterOpen(true)}
                className="w-full py-3 rounded-xl border-2 border-orange-100 text-orange-primary font-bold hover:bg-orange-50 transition-colors"
              >
                Select Plan
              </button>
            </div>

            <div className="p-10 rounded-3xl border-2 border-orange-500 shadow-2xl shadow-orange-100 relative overflow-hidden reveal bg-white scale-105">
              <div className="absolute top-0 right-0 bg-orange-primary text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-extrabold mb-6">
                $29<span className="text-lg text-gray-400 font-normal">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> 1TB Storage
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Full GraphQL Access
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Team Collaboration
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Priority Support
                </li>
              </ul>
              <button
                onClick={() => setRegisterOpen(true)}
                className="w-full py-3 rounded-xl bg-orange-gradient text-white font-bold shadow-lg shadow-orange-200"
              >
                Get Pro
              </button>
            </div>

            <div className="p-10 rounded-3xl border border-gray-100 hover:shadow-2xl transition-all reveal bg-white">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-extrabold mb-6">Custom</div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Unlimited Storage
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> SLA Guarantee
                </li>
                <li className="flex items-center gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-500"></i> Custom Onboarding
                </li>
              </ul>
              <button
                onClick={() => setRegisterOpen(true)}
                className="w-full py-3 rounded-xl border-2 border-orange-100 text-orange-primary font-bold hover:bg-orange-50 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 pt-32 pb-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-orange-gradient p-12 lg:p-20 rounded-[3rem] text-center text-white mb-20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-extrabold mb-8">Ready to secure your data?</h2>
              <p className="text-orange-100 text-xl mb-10 max-w-2xl mx-auto">
                Join over 10,000 developers building the next generation of secure applications with CipherDocs.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <input
                  type="email"
                  placeholder="enter your work email"
                  className="px-8 py-4 rounded-2xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30 min-w-[300px]"
                />
                <button
                  onClick={() => setRegisterOpen(true)}
                  className="px-8 py-4 bg-white text-orange-primary rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
                >
                  Get Early Access
                </button>
              </div>
            </div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-orange-gradient rounded-lg flex items-center justify-center">
                  <i data-lucide="shield-check" className="text-white w-5 h-5"></i>
                </div>
                <span className="text-xl font-bold">CipherDocs</span>
              </div>
              <p className="text-gray-500 max-w-sm">
                The world&apos;s most developer-friendly document storage platform. Secure, fast, and scalable.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-gray-500">
                <li>
                  <a href={GRAPHQL_URL} target="_blank" rel="noreferrer" className="hover:text-orange-primary">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    SDKs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-gray-500">
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-primary">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-200 pt-10 text-gray-400 text-sm">
            <p>&copy; 2024 CipherDocs Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-orange-primary transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-orange-primary transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-orange-primary transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      <div
        id="login-modal"
        className={`modal fixed inset-0 z-[100] bg-black/50 items-center justify-center p-4 ${
          loginOpen ? "open" : ""
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeAll();
        }}
      >
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300">
          <button onClick={closeAll} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
            <i data-lucide="x" className="w-6 h-6"></i>
          </button>
          <h3 className="text-2xl font-bold mb-6">Welcome Back</h3>
          <form onSubmit={submitLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or username</label>
              <input
                value={loginEmailOrUser}
                onChange={(e) => setLoginEmailOrUser(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                placeholder="admin or admin@cipherdocs.local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 bg-orange-gradient text-white rounded-xl font-bold shadow-lg shadow-orange-200 mt-2"
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
            {loginError ? <div className="text-sm text-red-600">{loginError}</div> : null}
            <div className="text-center text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setLoginOpen(false);
                  setRegisterOpen(true);
                }}
                className="text-orange-primary font-bold"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        id="register-modal"
        className={`modal fixed inset-0 z-[100] bg-black/50 items-center justify-center p-4 ${
          registerOpen ? "open" : ""
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeAll();
        }}
      >
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
          <button onClick={closeAll} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
            <i data-lucide="x" className="w-6 h-6"></i>
          </button>
          <h3 className="text-2xl font-bold mb-6">Create Account</h3>
          <form onSubmit={submitRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                placeholder="jane@doe.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-4 bg-orange-gradient text-white rounded-xl font-bold shadow-lg shadow-orange-200 mt-2"
            >
              {regLoading ? "Creating..." : "Create Account"}
            </button>
            {regError ? <div className="text-sm text-red-600">{regError}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}
