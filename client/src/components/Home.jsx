import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import roboticsTriptych from '../assets/bapesu-student-robotics.png';
import HomeLab from './HomeLab';
import { ServicesOverview, TaglineReveal, SuppliesSection, PrintersSection, RepairSection, RndSection, TutorialsSection, FaqSection, FinalCta, waLink, QUOTE_MESSAGE } from './home/LandingSections';
import './home.css';

const heroSlides = [
  { id: 'printer', label: 'Impresión 3D', title: 'Imprime, abastece', highlight: 'y repara en 3D.', description: 'Imprimimos tus piezas, vendemos filamentos, resinas y repuestos, y dejamos tu impresora 3D funcionando como el primer día.', target: 'servicios', accent: '#c2a1ff' },
  { id: 'robot', label: 'Robótica', title: 'Dale movimiento', highlight: 'a tus ideas.', description: 'Robots que exploran, aprenden y transforman. Combinamos ingeniería y creatividad para construir lo que imaginas.', target: 'robotica', accent: '#64f7df' },
  { id: 'circuit', label: 'Electrónica', title: 'Conecta ideas.', highlight: 'Enciende el futuro.', description: 'Sensores, circuitos y pequeñas conexiones con grandes posibilidades. Damos vida a dispositivos que interactúan con el mundo.', target: 'electronica', accent: '#70d9ff' },
];
const studentSlides = [
  {
    title: 'Imagina y construye',
    description: 'Cada reto empieza con una idea y toma forma en equipo.',
    alt: 'Estudiantes de colegio construyendo un robot educativo en equipo',
  },
  {
    title: 'Aprende con tus manos',
    description: 'Electrónica, sensores y programación explicados haciendo.',
    alt: 'Detalle de un kit de robótica escolar con microcontrolador y sensores',
  },
  {
    title: 'Ponlo a prueba',
    description: 'Prototipos que se mueven, exploran y resuelven desafíos.',
    alt: 'Grupo de estudiantes probando su robot en una pista de aula',
  },
];

const sections = [
  {
    id: 'electronica',
    number: '01',
    title: 'Electrónica',
    description: 'Diseñamos y conectamos componentes electrónicos para dar vida a dispositivos y productos funcionales.',
    capabilities: ['Circuitos y módulos', 'Sensores', 'Integración de componentes'],
    icon: <><path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4z"/></>,
    color: 'cyan',
  },
  {
    id: 'robotica',
    number: '02',
    title: 'Robótica',
    description: 'Creamos prototipos y sistemas que combinan mecánica, electrónica y programación para resolver retos reales.',
    capabilities: ['Robots y prototipos', 'Automatización', 'Proyectos educativos'],
    icon: <><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4m-4 5h.01M16 12h.01M9 16h6M3 11v4m18-4v4"/></>,
    color: 'emerald',
  },
  {
    id: 'desarrollo-software',
    number: '03',
    title: 'Desarrollo de software',
    description: 'Construimos herramientas digitales para organizar procesos, conectar servicios y hacer crecer proyectos.',
    capabilities: ['Aplicaciones web', 'Automatización de procesos', 'Integraciones y sistemas a la medida'],
    icon: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14l-2 2 2 2m4 0h4"/></>,
    color: 'amber',
  },
];

const colorStyles = {
  violet: { icon: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300', dot: 'bg-violet-500', border: 'group-hover:border-violet-300 dark:group-hover:border-violet-400/40' },
  cyan: { icon: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300', dot: 'bg-cyan-500', border: 'group-hover:border-cyan-300 dark:group-hover:border-cyan-400/40' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-400/40' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300', dot: 'bg-amber-500', border: 'group-hover:border-amber-300 dark:group-hover:border-amber-400/40' },
};

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroHover, setHeroHover] = useState(false);
  const [heroFocus, setHeroFocus] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hero = heroSlides[heroIndex];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (heroPaused || heroHover || heroFocus || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroHover, heroFocus, reducedMotion, heroIndex]);
  const moveHero = (step) => setHeroIndex((index) => (index + step + heroSlides.length) % heroSlides.length);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [sliderInteracting, setSliderInteracting] = useState(false);

  useEffect(() => {
    if (isSliderPaused || sliderInteracting || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % studentSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isSliderPaused, sliderInteracting]);

  const changeSlide = (direction) => {
    setActiveSlide((current) => (current + direction + studentSlides.length) % studentSlides.length);
  };

  return (
    <div className="home-future">
      <section data-paused={heroPaused || reducedMotion} className="home-hero" style={{ '--lab-cyan': hero.accent }} aria-label="Explora Bapesu" aria-roledescription="carrusel"
        onMouseEnter={() => setHeroHover(true)} onMouseLeave={() => setHeroHover(false)}
        onFocusCapture={() => setHeroFocus(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroFocus(false); }}>
        <div className="home-circuit-backdrop" aria-hidden="true">
          <svg viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
            {['M0 180H180L280 280H620L760 140H1400', 'M0 650H250L420 480H820L1000 660H1400', 'M0 700H290L460 530H850L1030 710H1400', 'M1400 340H1180L1040 200H820L680 340H500'].map((path, index) => <g key={path}><path d={path} /><path className="home-circuit-pulse" d={path} style={{ animationDelay: (-index * 2) + 's' }} /></g>)}
          </svg>
        </div>
        <AnimatePresence mode="wait" initial={false}>
        <motion.div className="home-hero-copy" key={hero.id}
          initial="hidden" animate="visible" exit="exit"
          variants={{ hidden: { opacity: 0, x: reducedMotion ? 0 : 32 }, visible: { opacity: 1, x: 0, transition: { staggerChildren: .09, duration: reducedMotion ? 0 : .45 } }, exit: { opacity: 0, x: reducedMotion ? 0 : -20, transition: { duration: reducedMotion ? 0 : .18 } } }}>
          <span className="home-eyebrow"><i /> BAPESU · {hero.label.toUpperCase()}</span>
          <h1 aria-label={hero.title + ' ' + hero.highlight}>{[hero.title, hero.highlight].map((line, lineIndex) => <span className={'home-title-line ' + (lineIndex ? 'home-title-accent' : '')} key={line} aria-hidden="true">{line.split(' ').map((word, index) => <motion.b key={index} variants={{ hidden: { y: reducedMotion ? 0 : 50, opacity: 0, rotateX: reducedMotion ? 0 : 35 }, visible: { y: 0, opacity: 1, rotateX: 0, transition: { type: 'spring', stiffness: 110, damping: 18 } } }}>{word}{' '}</motion.b>)}</span>)}</h1>
          <p className="home-hero-description">{hero.description}</p>
          <div className="home-hero-actions">
            <a href={waLink(QUOTE_MESSAGE)} target="_blank" rel="noopener noreferrer">Cotizar por WhatsApp <span aria-hidden="true">↗</span></a>
            <a href={'#' + hero.target}>{hero.id === 'printer' ? 'Ver servicios' : 'Explorar ' + hero.label.toLowerCase()} <span aria-hidden="true">↓</span></a>
          </div>
          <p className="home-hero-links">Impresión bajo pedido · Impresoras e insumos · Reparación · I+D para empresas</p>
        </motion.div>
        </AnimatePresence>
        <HomeLab mode={hero.id} isPaused={heroPaused} reducedMotion={reducedMotion} />
        <div className="home-slider-controls">
          <span className="home-slider-count">0{heroIndex + 1}<span> / 03</span></span>
          <div className="home-slider-tabs" aria-label="Elegir diapositiva">
            {heroSlides.map((slide, index) => <button key={slide.id} type="button" aria-pressed={index === heroIndex} onClick={() => setHeroIndex(index)}><span>0{index + 1}</span>{slide.label}</button>)}
          </div>
          <div className="home-slider-arrows">
            <button type="button" onClick={() => moveHero(-1)} aria-label="Diapositiva anterior">←</button>
            <button type="button" onClick={() => setHeroPaused((value) => !value)} aria-pressed={heroPaused} aria-label={heroPaused ? 'Reanudar animación' : 'Pausar animación'}>{heroPaused ? '▶' : 'Ⅱ'}</button>
            <button type="button" onClick={() => moveHero(1)} aria-label="Diapositiva siguiente">→</button>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <ServicesOverview />
      <TaglineReveal />
      <SuppliesSection />
      <PrintersSection />
      <RepairSection />
      <RndSection />
      <TutorialsSection />

      <section aria-labelledby="areas-title" className="mt-16 sm:mt-24">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">También hacemos</p>
            <h2 id="areas-title" className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-4xl">Tecnología más allá de la impresión 3D</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-500 dark:text-gray-400">Unimos distintas disciplinas para acompañar cada etapa, desde la primera idea hasta una solución lista para usar.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const colors = colorStyles[section.color];
            return (
              <motion.article initial={reducedMotion ? false : { opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .55 }} id={section.id} key={section.id} data-accent={section.color} className={`home-tech-card group scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-[#0d0d1a] sm:p-8 ${colors.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon}`}>
                    <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{section.icon}</svg>
                  </div>
                  <span className="font-mono text-sm font-bold tracking-widest text-gray-300 dark:text-gray-600">{section.number}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-950 dark:text-white">{section.title}</h3>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-gray-600 dark:text-gray-300">{section.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {section.capabilities.map((item) => (
                    <li key={item} className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />{item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="bapesu-student-title" className="home-student relative mt-14 overflow-hidden rounded-[2rem] bg-[#11152b] text-white shadow-xl shadow-indigo-950/10 sm:mt-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(124,58,237,0.24),transparent_42%),radial-gradient(ellipse_at_100%_100%,rgba(6,182,212,0.2),transparent_38%)]" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-14">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> Proyecto educativo
            </span>
            <h2 id="bapesu-student-title" className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Bapesu <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Student</span></h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-indigo-100/85 sm:text-lg">
              Robótica para los colegios: una experiencia práctica para que niñas, niños y jóvenes aprendan tecnología creando sus propios proyectos.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Pensamiento lógico', 'Creatividad', 'Trabajo en equipo'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85">{item}</span>
              ))}
            </div>
            <a href="#bapesu-student-aprendizaje" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#11152b]">
              Explorar el proyecto <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="order-1 lg:order-2">
            <div role="region" aria-roledescription="carrusel" aria-label="Experiencias de Bapesu Student" className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30" onMouseEnter={() => setSliderInteracting(true)} onMouseLeave={() => setSliderInteracting(false)} onFocus={() => setSliderInteracting(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSliderInteracting(false); }}>
              <div className="relative aspect-square overflow-hidden sm:aspect-[1.08/1]">
                <img
                  src={roboticsTriptych}
                  alt={studentSlides[activeSlide].alt}
                  className="absolute left-0 top-0 h-full max-w-none object-cover transition-transform duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: '300%', transform: `translateX(-${activeSlide * (100 / 3)}%)` }}
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#080b18]/85 via-[#080b18]/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">{String(activeSlide + 1).padStart(2, '0')} / 03 · Bapesu Student</p>
                    <h3 className="mt-2 text-xl font-extrabold text-white sm:text-2xl" aria-live="polite">{studentSlides[activeSlide].title}</h3>
                    <p className="mt-1 max-w-sm text-sm leading-5 text-white/80">{studentSlides[activeSlide].description}</p>
                  </div>
                  <div className="hidden shrink-0 gap-2 sm:flex">
                    <button type="button" onClick={() => changeSlide(-1)} aria-label="Imagen anterior" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-lg text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200">‹</button>
                    <button type="button" onClick={() => changeSlide(1)} aria-label="Imagen siguiente" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-lg text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200">›</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2" aria-label="Seleccionar imagen">
                  {studentSlides.map((slide, index) => (
                    <button key={slide.title} type="button" onClick={() => setActiveSlide(index)} aria-label={`Mostrar imagen ${index + 1}: ${slide.title}`} aria-current={activeSlide === index ? 'true' : undefined} className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-200 ${activeSlide === index ? 'w-8 bg-cyan-300' : 'w-2 bg-white/35 hover:bg-white/70'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => changeSlide(-1)} aria-label="Imagen anterior" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200 sm:hidden">‹</button>
                  <button type="button" onClick={() => changeSlide(1)} aria-label="Imagen siguiente" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200 sm:hidden">›</button>
                  <button type="button" onClick={() => setIsSliderPaused((paused) => !paused)} aria-label={isSliderPaused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático'} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200">{isSliderPaused ? 'Reproducir' : 'Pausar'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="bapesu-student-aprendizaje" className="relative grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
          {[
            { title: 'Descubre', text: 'Explora cómo funcionan los robots, los sensores y la electrónica.' },
            { title: 'Construye', text: 'Diseña prototipos y aprende programación paso a paso.' },
            { title: 'Comparte', text: 'Presenta ideas y resuelve retos en equipo dentro del colegio.' },
          ].map((item, index) => (
            <article key={item.title} className="bg-[#11152b]/95 px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Etapa 0{index + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-indigo-100/70">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <FaqSection />
      <FinalCta />
      </div>
    </div>
  );
}
