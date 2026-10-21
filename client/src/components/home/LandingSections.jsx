import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform, cubicBezier } from 'motion/react';
import {
  Cube, Package, Wrench, WhatsappLogo, ArrowRight, Calculator, CheckCircle,
  Drop, Thermometer, Gear, Nut, Cpu, Stethoscope, Printer, ShieldCheck, Plus,
  Lightning, Palette, Headset, Plant, GasPump, PencilRuler, Lightbulb, Flask, Rocket,
  YoutubeLogo, Play, Bell,
} from '@phosphor-icons/react';

// Número de ventas usado en el checkout. Cámbialo aquí si los servicios 3D usan otra línea.
export const WHATSAPP_NUMBER = '573153791422';
export const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
export const QUOTE_MESSAGE = 'Hola Bapesu, quiero cotizar un servicio de impresión 3D.';

const EASE = [0.32, 0.72, 0, 1];
const EASE_CLASS = 'transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]';
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black';
export const PRIMARY_BTN = `inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-base font-semibold text-white hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-[0.98] ${EASE_CLASS} ${FOCUS}`;
const GHOST_BTN = `inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-100 active:scale-[0.98] dark:border-white/15 dark:text-white dark:hover:bg-white/10 ${EASE_CLASS} ${FOCUS}`;
const CARD = 'rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#181818]';

function Reveal({ as = 'div', className = '', delay = 0, children, ...rest }) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      initial={reduced ? false : { opacity: 0, y: 64, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function SectionHeading({ eyebrow, title, text, id }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 [text-wrap:balance] dark:text-white sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-base text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>}
    </div>
  );
}

/* ── 1. Servicios principales ─────────────────────────────── */

const services = [
  {
    id: 'impresion',
    Icon: Printer,
    title: 'Impresión 3D bajo pedido',
    text: 'Envíanos tu archivo STL o tu idea y te entregamos la pieza lista para usar.',
    items: ['Prototipos y piezas funcionales', 'Repuestos y soportes a medida', 'PLA, PETG, TPU y resina'],
    cta: { label: 'Calcular el precio de mi pieza', to: '/tools/3d-print-calculator' },
  },
  {
    id: 'insumos',
    Icon: Package,
    title: 'Venta de insumos 3D',
    text: 'Filamentos, resinas y repuestos para que tu impresora no se detenga.',
    items: ['Filamentos y resinas', 'Boquillas, hotends y camas', 'Correas, rodamientos y electrónica'],
    cta: { label: 'Ver insumos', href: '#insumos' },
  },
  {
    id: 'venta-impresoras',
    Icon: Cube,
    title: 'Venta de impresoras 3D',
    text: 'Te asesoramos para elegir la impresora que encaja con tu uso y tu presupuesto.',
    items: ['Impresoras de filamento y de resina', 'Equipos para empezar o producir', 'Entrega instalada y calibrada'],
    cta: { label: 'Ver impresoras', href: '#impresoras' },
  },
  {
    id: 'reparacion',
    Icon: Wrench,
    title: 'Mantenimiento y reparación',
    text: 'Diagnosticamos, reparamos y calibramos tu impresora 3D FDM o de resina.',
    items: ['Diagnóstico y cotización previa', 'Cambio de piezas y calibración', 'Prueba de impresión al entregar'],
    cta: { label: 'Ver cómo funciona', href: '#mantenimiento' },
  },
];

export function ServicesOverview() {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="mt-16 sm:mt-24">
      <Reveal>
        <SectionHeading
          id="servicios-title"
          eyebrow="Servicios 3D"
          title="Todo lo que tu proyecto 3D necesita, en un solo lugar"
          text="Imprimimos tus piezas, te vendemos los insumos y mantenemos tu impresora funcionando. Un solo contacto para todo el proceso."
        />
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {services.map(({ id, Icon, title, text, items, cta }, index) => (
          <Reveal as="article" key={id} delay={index * 0.1} className={`${CARD} group flex flex-col p-6 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-400/40 ${EASE_CLASS}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Icon size={24} weight="duotone" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-gray-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>
            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <CheckCircle size={20} weight="fill" className="shrink-0 text-indigo-500" aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              {cta.to ? (
                <Link to={cta.to} className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-indigo-600 hover:gap-3 dark:text-indigo-300 ${EASE_CLASS} ${FOCUS}`}>
                  <Calculator size={20} aria-hidden="true" />{cta.label}
                </Link>
              ) : (
                <a href={cta.href} className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-indigo-600 hover:gap-3 dark:text-indigo-300 ${EASE_CLASS} ${FOCUS}`}>
                  {cta.label}<ArrowRight size={20} aria-hidden="true" />
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 2. Frase principal que se ilumina palabra por palabra ── */

const curve = cubicBezier(...EASE);

function RevealWord({ word, progress, range, reduced }) {
  const opacity = useTransform(progress, range, [0.3, 1], { ease: curve });
  return <motion.span style={{ opacity: reduced ? 1 : opacity }} className="inline-block">{word}&nbsp;</motion.span>;
}

export function TaglineReveal() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  const lines = ['Tu impresora funcionando,', 'tus insumos a tiempo', 'y tus piezas listas para usar.'];
  const words = lines.flatMap((line, lineIndex) => line.split(' ').map((word) => ({ word, lineIndex })));
  return (
    <section aria-label="Nuestra promesa" className="mt-16 sm:mt-24">
      <p ref={ref} className="mx-auto max-w-[680px] text-center text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
        {lines.map((line, lineIndex) => (
          <span key={line} className="block">
            {words.map((entry, index) => entry.lineIndex === lineIndex && (
              <RevealWord key={index} word={entry.word} progress={scrollYProgress} reduced={reduced}
                range={[index / words.length, (index + 1) / words.length]} />
            ))}
          </span>
        ))}
      </p>
    </section>
  );
}

/* ── 3. Insumos ───────────────────────────────────────────── */

const supplies = [
  { Icon: Cube, title: 'Filamentos', text: 'PLA, PETG, TPU flexible y ABS en 1.75 mm, en varios colores.' },
  { Icon: Drop, title: 'Resinas', text: 'Resina estándar y lavable con agua para impresoras SLA y MSLA.' },
  { Icon: Thermometer, title: 'Boquillas y hotends', text: 'Boquillas de latón y acero endurecido, bloques calefactores y kits completos.' },
  { Icon: Printer, title: 'Camas y superficies', text: 'Láminas PEI, vidrio templado y superficies magnéticas.' },
  { Icon: Gear, title: 'Repuestos mecánicos', text: 'Correas GT2, poleas, rodamientos, ruedas y tornillos para ejes.' },
  { Icon: Cpu, title: 'Electrónica', text: 'Termistores, cartuchos calefactores, ventiladores, drivers y finales de carrera.' },
];

export function SuppliesSection() {
  return (
    <section id="insumos" aria-labelledby="insumos-title" className="mt-16 sm:mt-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <SectionHeading
            id="insumos-title"
            eyebrow="Venta de insumos"
            title="Insumos para imprimir sin pausas"
            text="Material y repuestos para las impresoras más comunes. Escríbenos qué necesitas y te confirmamos disponibilidad y precio."
          />
        </Reveal>
        <Reveal delay={0.1} className="flex flex-wrap gap-3">
          <Link to="/tienda" className={PRIMARY_BTN}>
            <Package size={20} aria-hidden="true" />Comprar en la tienda
          </Link>
          <a href={waLink('Hola Bapesu, quiero consultar disponibilidad de insumos 3D.')} target="_blank" rel="noopener noreferrer" className={GHOST_BTN}>
            <WhatsappLogo size={20} aria-hidden="true" />Consultar por WhatsApp
          </a>
        </Reveal>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {supplies.map(({ Icon, title, text }, index) => (
          <Reveal as="li" key={title} delay={(index % 3) * 0.1} className={`${CARD} flex gap-4 p-6`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white">
              <Icon size={20} weight="duotone" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-950 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ── Venta de impresoras ──────────────────────────────────── */

const printers = [
  {
    Icon: Printer,
    title: 'Para empezar',
    text: 'Impresoras de filamento fáciles de usar, ideales para aprender, crear en casa o en el aula.',
    items: ['Configuración sencilla', 'Materiales PLA y PETG', 'Bajo costo de operación'],
  },
  {
    Icon: Lightning,
    title: 'Para producir',
    text: 'Equipos rápidos y confiables para emprendimientos y talleres que imprimen todos los días.',
    items: ['Mayor velocidad de impresión', 'Opciones multicolor', 'Volumen de impresión amplio'],
    featured: true,
  },
  {
    Icon: Drop,
    title: 'Alto detalle',
    text: 'Impresoras de resina para joyería, odontología, miniaturas y piezas con acabado fino.',
    items: ['Detalle de alta resolución', 'Superficies lisas', 'Acompañamiento en el posprocesado'],
  },
];

const printerPerks = [
  { Icon: ShieldCheck, text: 'Entrega instalada y calibrada' },
  { Icon: Headset, text: 'Capacitación inicial de uso' },
  { Icon: Wrench, text: 'Soporte, insumos y repuestos con nosotros' },
];

export function PrintersSection() {
  return (
    <section id="impresoras" aria-labelledby="impresoras-title" className="mt-16 sm:mt-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <SectionHeading
            id="impresoras-title"
            eyebrow="Venta de impresoras 3D"
            title="La impresora correcta para lo que quieres crear"
            text="Cuéntanos qué vas a imprimir y te recomendamos el equipo adecuado. Sin pagar por funciones que no vas a usar."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <a href={waLink('Hola Bapesu, quiero asesoría para comprar una impresora 3D.')} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}>
            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Pedir asesoría de compra
          </a>
        </Reveal>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {printers.map(({ Icon, title, text, items, featured }, index) => (
          <Reveal as="article" key={title} delay={index * 0.1} className={`${CARD} relative flex flex-col p-6 hover:-translate-y-1 ${EASE_CLASS} ${featured ? 'border-indigo-300 dark:border-indigo-400/40' : ''}`}>
            {featured && <span className="absolute right-6 top-6 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">Más pedida</span>}
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white">
              <Icon size={24} weight="duotone" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-gray-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>
            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <CheckCircle size={20} weight="fill" className="shrink-0 text-indigo-500" aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <Reveal as="ul" className={`${CARD} mt-6 grid gap-4 p-6 sm:grid-cols-3`}>
        {printerPerks.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white">
            <Icon size={24} weight="duotone" className="shrink-0 text-indigo-500" aria-hidden="true" />{text}
          </li>
        ))}
      </Reveal>
    </section>
  );
}

/* ── 4. Mantenimiento y reparación ────────────────────────── */

const issues = [
  'Boquilla tapada o filamento que no sale',
  'La primera capa no se pega a la cama',
  'Capas desplazadas o piezas deformes',
  'Temperatura inestable o errores de termistor',
  'Ruidos, vibraciones o ejes trabados',
  'Firmware desactualizado o pantalla con errores',
];

const steps = [
  { Icon: Stethoscope, title: 'Diagnóstico', text: 'Revisamos tu impresora y te enviamos qué falla y cuánto cuesta repararla.' },
  { Icon: Nut, title: 'Reparación', text: 'Con tu aprobación cambiamos piezas, limpiamos, lubricamos y calibramos.' },
  { Icon: ShieldCheck, title: 'Prueba y entrega', text: 'Hacemos una impresión de prueba y te entregamos el equipo funcionando.' },
];

export function RepairSection() {
  return (
    <section id="mantenimiento" aria-labelledby="mantenimiento-title" className="mt-16 overflow-hidden rounded-3xl bg-[#181818] text-white sm:mt-24">
      <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-2 lg:p-16">
        <Reveal>
          <p className="text-sm font-semibold text-indigo-300">Mantenimiento y reparación</p>
          <h2 id="mantenimiento-title" className="mt-2 text-3xl font-semibold tracking-tight [text-wrap:balance] sm:text-4xl">Tu impresora 3D de vuelta en funcionamiento</h2>
          <p className="mt-4 text-base text-gray-300 [text-wrap:pretty]">Atendemos impresoras FDM y de resina. Conoces el valor de la reparación antes de que empecemos.</p>
          <p className="mt-8 text-sm font-semibold text-white">Fallas que reparamos con frecuencia</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {issues.map((issue) => (
              <li key={issue} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-indigo-400" aria-hidden="true" />{issue}
              </li>
            ))}
          </ul>
          <a href={waLink('Hola Bapesu, necesito mantenimiento o reparación para mi impresora 3D.')} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BTN} mt-10 focus-visible:ring-offset-[#181818]`}>
            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Agendar diagnóstico
          </a>
        </Reveal>
        <ol className="grid content-start gap-4">
          {steps.map(({ Icon, title, text }, index) => (
            <Reveal as="li" key={title} delay={index * 0.12} className="flex gap-4 rounded-2xl border border-white/10 bg-[#272727] p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300">
                <Icon size={24} weight="duotone" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-xs text-gray-400">Paso 0{index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-300 [text-wrap:pretty]">{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── I+D para empresas ────────────────────────────────────── */

const sectors = [
  {
    Icon: Plant,
    title: 'Sector agrícola',
    text: 'Tecnología para el campo que ayuda a producir más con menos recursos.',
    items: ['Monitoreo de cultivos con sensores', 'Automatización de riego', 'Repuestos y piezas a medida para equipos'],
  },
  {
    Icon: GasPump,
    title: 'Sector petrolero',
    text: 'Soluciones para operaciones exigentes donde cada parada cuesta.',
    items: ['Prototipos y repuestos a medida', 'Carcasas y soportes para instrumentación', 'Monitoreo remoto de variables'],
  },
  {
    Icon: PencilRuler,
    title: 'Desarrollo de diseños',
    text: 'Llevamos tu idea de un boceto a un modelo listo para fabricar.',
    items: ['Modelado CAD y renders', 'Ingeniería inversa de piezas', 'Prototipos funcionales impresos en 3D'],
  },
];

const rndSteps = [
  { Icon: Lightbulb, title: 'Entendemos el reto', text: 'Visitamos o analizamos tu operación para definir el problema y los requisitos.' },
  { Icon: Flask, title: 'Diseñamos y prototipamos', text: 'Combinamos diseño, electrónica, software e impresión 3D para crear una primera versión.' },
  { Icon: Rocket, title: 'Validamos e implementamos', text: 'Probamos en condiciones reales, ajustamos y entregamos la solución documentada.' },
];

export function RndSection() {
  return (
    <section id="investigacion" aria-labelledby="investigacion-title" className="mt-16 sm:mt-24">
      <Reveal>
        <SectionHeading
          id="investigacion-title"
          eyebrow="Investigación y desarrollo (I+D)"
          title="Desarrollamos soluciones a la medida para tu empresa"
          text="Creamos tecnología para empresas del sector agrícola y petrolero, y diseños a la medida para quien necesite una pieza o un producto nuevo."
        />
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {sectors.map(({ Icon, title, text, items }, index) => (
          <Reveal as="article" key={title} delay={index * 0.1} className={`${CARD} flex flex-col p-6 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-400/40 ${EASE_CLASS}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Icon size={24} weight="duotone" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-gray-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>
            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <CheckCircle size={20} weight="fill" className="shrink-0 text-indigo-500" aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <div className="mt-6 grid gap-6 rounded-3xl bg-[#181818] p-6 text-white sm:p-10 lg:grid-cols-[1fr_2fr] lg:items-center">
        <Reveal>
          <h3 className="text-2xl font-semibold tracking-tight [text-wrap:balance]">Cómo trabajamos un proyecto de I+D</h3>
          <a href={waLink('Hola Bapesu, quiero proponer un proyecto de I+D para mi empresa.')} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BTN} mt-6 focus-visible:ring-offset-[#181818]`}>
            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Proponer un proyecto
          </a>
        </Reveal>
        <ol className="grid gap-4 sm:grid-cols-3">
          {rndSteps.map(({ Icon, title, text }, index) => (
            <Reveal as="li" key={title} delay={index * 0.12} className="rounded-2xl border border-white/10 bg-[#272727] p-6">
              <Icon size={24} weight="duotone" className="text-indigo-300" aria-hidden="true" />
              <p className="mt-4 font-mono text-xs text-gray-400">Paso 0{index + 1}</p>
              <h4 className="mt-1 text-base font-semibold">{title}</h4>
              <p className="mt-1 text-sm text-gray-300 [text-wrap:pretty]">{text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Videotutoriales ──────────────────────────────────────── */

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@BapesuTech';

// Para agregar un tutorial, añade su id de YouTube (lo que va después de "watch?v=").
const tutorials = [
  {
    id: '_D5-DN-ZGLg',
    title: 'Así de fácil puedes crear letras 3D en Bambu Studio',
    text: 'Aprende a escribir un texto, darle volumen y dejarlo listo para imprimir en pocos pasos.',
    tag: 'Bambu Studio',
  },
];

function VideoPlayer({ video }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Reproducir: ${video.title}`} className={`group absolute inset-0 h-full w-full ${FOCUS}`}>
          <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" className={`h-full w-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 ${EASE_CLASS}`} />
          <span className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-950 group-hover:scale-110 group-active:scale-[0.98] ${EASE_CLASS}`}>
            <Play size={24} weight="fill" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}

export function TutorialsSection() {
  const [current, setCurrent] = useState(0);
  const video = tutorials[current];
  return (
    <section id="tutoriales" aria-labelledby="tutoriales-title" className="mt-16 sm:mt-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <SectionHeading
            id="tutoriales-title"
            eyebrow="Videotutoriales"
            title="Aprende impresión 3D paso a paso"
            text="Tutoriales gratuitos en español para diseñar, configurar e imprimir mejor. Publicamos nuevos videos en nuestro canal de YouTube."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <a href={`${YOUTUBE_CHANNEL}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className={GHOST_BTN}>
            <Bell size={20} aria-hidden="true" />Suscribirme al canal
          </a>
        </Reveal>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Reveal className={`${CARD} p-2`}>
          <VideoPlayer key={video.id} video={video} />
        </Reveal>
        <Reveal delay={0.1} className={`${CARD} flex flex-col p-6`}>
          <span className="w-max rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">{video.tag}</span>
          <h3 className="mt-4 text-xl font-semibold text-gray-950 [text-wrap:balance] dark:text-white">{video.title}</h3>
          <p className="mt-2 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{video.text}</p>
          {tutorials.length > 1 && (
            <ul className="mt-6 grid gap-3" aria-label="Más tutoriales">
              {tutorials.map((item, index) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setCurrent(index)} aria-current={index === current ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${index === current ? 'bg-gray-100 font-semibold dark:bg-white/10' : ''} ${EASE_CLASS} ${FOCUS}`}>
                    <img src={`https://i.ytimg.com/vi/${item.id}/default.jpg`} alt="" loading="lazy" className="h-10 w-16 shrink-0 rounded object-cover" />
                    <span className="text-gray-900 dark:text-white">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer" className={`mt-auto inline-flex items-center gap-2 rounded-lg pt-8 text-sm font-semibold text-indigo-600 hover:gap-3 dark:text-indigo-300 ${EASE_CLASS} ${FOCUS}`}>
            <YoutubeLogo size={20} weight="fill" aria-hidden="true" />Ver todos los tutoriales
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 5. Preguntas frecuentes ──────────────────────────────── */

export const faqs = [
  { q: '¿Qué necesito para cotizar una impresión?', a: 'El archivo STL u OBJ, o una foto con medidas si aún no tienes el modelo. Con eso te indicamos material, tiempo y precio.' },
  { q: '¿Puedo calcular el precio yo mismo?', a: 'Sí. Nuestra calculadora de impresión 3D gratuita estima el costo según material, tiempo de impresión y energía.' },
  { q: '¿Qué materiales imprimen?', a: 'Trabajamos con PLA, PETG y TPU en impresión por filamento, y con resina cuando la pieza necesita alto detalle.' },
  { q: '¿Venden filamento por unidad?', a: 'Sí. Puedes comprar una sola bobina o varias en nuestra tienda en línea, o escribirnos el material, color y diámetro que necesitas.' },
  { q: '¿Venden impresoras 3D?', a: 'Sí. Te asesoramos según lo que quieres imprimir y tu presupuesto, y te entregamos el equipo instalado y calibrado.' },
  { q: '¿Desarrollan proyectos para empresas?', a: 'Sí. Nuestro equipo de I+D crea soluciones para los sectores agrícola y petrolero, y diseños a la medida. Escríbenos con tu reto y agendamos una reunión.' },
  { q: '¿Qué impresoras reparan?', a: 'Impresoras FDM y de resina de las marcas más comunes. Si tienes un modelo poco común, envíanos la referencia y te confirmamos.' },
  { q: '¿Cobran el diagnóstico?', a: 'Te informamos el valor del diagnóstico antes de recibir el equipo, y el costo de la reparación antes de hacerla.' },
  { q: '¿Cuánto tarda una reparación?', a: 'Depende de la falla y de la disponibilidad de repuestos. Te damos un tiempo estimado junto con el diagnóstico.' },
  { q: '¿Cómo hago un pedido?', a: 'Escríbenos por WhatsApp con lo que necesitas. Te respondemos con la cotización y los pasos para confirmar.' },
];

export function FaqSection() {
  return (
    <section id="preguntas" aria-labelledby="preguntas-title" className="mt-16 grid gap-10 sm:mt-24 lg:grid-cols-[1fr_1.4fr]">
      <Reveal>
        <SectionHeading id="preguntas-title" eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos" text="Si tu duda no está aquí, escríbenos y te respondemos." />
      </Reveal>
      <div className="grid gap-3">
        {faqs.map(({ q, a }, index) => (
          <Reveal key={q} delay={Math.min(index, 4) * 0.05}>
            <details className={`${CARD} group p-4 open:border-indigo-300 dark:open:border-indigo-400/40`}>
              <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-base font-semibold text-gray-950 dark:text-white [&::-webkit-details-marker]:hidden ${FOCUS}`}>
                {q}
                <Plus size={20} className={`shrink-0 text-gray-400 group-open:rotate-45 ${EASE_CLASS}`} aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 6. Llamado final ─────────────────────────────────────── */

export function FinalCta() {
  return (
    <Reveal as="section" aria-labelledby="cta-title" className={`${CARD} mt-16 px-6 py-12 text-center sm:mt-24 sm:px-10 sm:py-16`}>
      <h2 id="cta-title" className="mx-auto max-w-[680px] text-3xl font-semibold tracking-tight text-gray-950 [text-wrap:balance] dark:text-white sm:text-4xl">Cuéntanos qué necesitas imprimir, comprar, reparar o desarrollar</h2>
      <p className="mx-auto mt-4 max-w-[680px] text-base text-gray-600 [text-wrap:pretty] dark:text-gray-300">Te respondemos por WhatsApp con una cotización clara antes de empezar.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a href={waLink(QUOTE_MESSAGE)} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}>
          <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Cotizar por WhatsApp
        </a>
        <Link to="/tools/3d-print-calculator" className={GHOST_BTN}>
          <Calculator size={20} aria-hidden="true" />Usar la calculadora
        </Link>
      </div>
    </Reveal>
  );
}
