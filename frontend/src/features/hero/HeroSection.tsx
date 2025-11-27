import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { OrbitingCircles } from '@/components/ui/OrbitingCircles'
import { TypingAnimation } from '@/registry/magicui/typing-animation'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useProfileStore } from '@/store/useProfileStore'
import { ChromeIcon, FlutterIcon, GoIcon, JavaIcon, PythonIcon, ReactIcon, VueIcon } from '@/components/icons/TechIcons'
import avatarSrc from '../../../assert/avator/avator.jpg'

// 外圈：3 个元素（Java / Chrome / Avatar）
const OUTER_ICONS = [
  { id: 'java', label: 'Java', render: () => <JavaIcon className="h-3/4 w-3/4" /> },
  { id: 'chrome', label: 'Chrome', render: () => <ChromeIcon className="h-3/4 w-3/4" /> },
  { id: 'avatar', label: 'Avatar', image: avatarSrc },
]

// 内圈：彩色技术栈图标
const INNER_ICONS = [
  { id: 'go', label: 'Go', render: () => <GoIcon className="h-full w-full" /> },
  { id: 'vue', label: 'Vue', render: () => <VueIcon className="h-full w-full" /> },
  { id: 'react', label: 'React', render: () => <ReactIcon className="h-full w-full" /> },
  { id: 'flutter', label: 'Flutter', render: () => <FlutterIcon className="h-full w-full" /> },
  { id: 'python', label: 'Python', render: () => <PythonIcon className="h-full w-full" /> },
]

let planePluginsRegistered = false

const registerPlanePlugins = () => {
  if (planePluginsRegistered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)
  planePluginsRegistered = true
}

export function HeroSection() {
  const hero = useProfileStore((state) => state.hero)
  const sectionRef = useSectionReveal<HTMLElement>()
  const planePathRef = useRef<SVGPathElement | null>(null)
  const planeContainerRef = useRef<HTMLDivElement | null>(null)
  const leftWingRef = useRef<SVGGElement | null>(null)
  const rightWingRef = useRef<SVGGElement | null>(null)

  useLayoutEffect(() => {
    if (!sectionRef.current || !planePathRef.current || !planeContainerRef.current) return

    registerPlanePlugins()

    const ctx = gsap.context(() => {
      const path = planePathRef.current!
      const planeContainer = planeContainerRef.current!
      const length = path.getTotalLength()

      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=140%',
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
        },
      })

      tl.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
      })

      tl.to(
        planeContainer,
        {
          motionPath: {
            path,
            align: path,
            autoRotate: true,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'none',
        },
        0,
      )

      // 只让左右机翼轻微抖动，机头朝向由 motionPath 控制
      const wings: SVGGElement[] = []
      if (leftWingRef.current) wings.push(leftWingRef.current)
      if (rightWingRef.current) wings.push(rightWingRef.current)

      if (wings.length) {
        gsap.to(wings, {
          transformBox: 'fill-box',
          // 以机头附近为旋转中心，这样机头不会分开，只是机尾轻微抖动
          transformOrigin: '100% 50%',
          rotation: 0.0000001,
          y: 0.99,
          yoyo: true,
          repeat: -1,
          duration: 0.22,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=140%',
            toggleActions: 'play pause resume pause',
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [sectionRef])

  return (
    <section
      ref={sectionRef}
      id="home"
      className="mx-auto my-6 mb-40 flex min-h-[420px] w-full max-w-5xl items-center justify-center overflow-visible px-6"
    >
      <div className="relative h-[622px] w-[622px] max-w-full">
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-white to-slate-200 blur-3xl dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-800" />
        <OrbitingCircles
          radius={300}
          iconSize={92}
          duration={28}
          pathClassName="orbit-path-dashed stroke-slate-300 dark:stroke-slate-700"
          className="border border-white/70 bg-white shadow-soft-card dark:border-slate-800 dark:bg-slate-900/60"
        >
          {OUTER_ICONS.map((item) => (
            <span
              key={item.id}
              className="flex size-full items-center justify-center rounded-full bg-white/90 text-4xl shadow-lg dark:bg-slate-900/80"
              aria-label={item.label}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                item.render?.()
              )}
            </span>
          ))}
        </OrbitingCircles>
        <div className="absolute inset-[70px]">
          <OrbitingCircles
            radius={240}
            iconSize={58}
            duration={18}
            delay={0.8}
            pathClassName="orbit-path-dashed stroke-slate-400 dark:stroke-slate-500"
            className="border border-white/70 bg-white/95 text-2xl shadow-soft-card dark:border-slate-800 dark:bg-slate-900/70"
          >
            {INNER_ICONS.map((item) => (
              <span key={item.id} aria-label={item.label} className="flex h-full w-full items-center justify-center">
                {item.render()}
              </span>
            ))}
          </OrbitingCircles>
        </div>
        <div className="absolute left-1/2 top-1/2 z-30 w-[360px] -translate-x-1/2 -translate-y-1/2">
          <CardContainer className="size-full">
            <CardBody className="relative overflow-visible rounded-[32px] border border-white/50 bg-white/95 p-8 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#0d1424] dark:text-white">
              <CardItem
                translateZ={30}
                className="text-base font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/80"
              >
                My name is:
              </CardItem>
              <CardItem translateZ={70} className="mt-4">
                <TypingAnimation
                  className="text-[56px] font-black leading-none text-slate-900 dark:text-white"
                  words={[hero.name]}
                  typeSpeed={110}
                  deleteSpeed={160}
                  pauseDelay={1800}
                  loop
                  cursorStyle="block"
                />
              </CardItem>
              <CardItem translateZ={35} className="mt-4">
                <span className="block h-px w-full bg-gradient-to-r from-transparent via-slate-400 to-transparent dark:via-white/50" />
              </CardItem>
              <CardItem
                translateZ={35}
                className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/80"
              >
                Write this blog to:
              </CardItem>
              <CardItem
                translateZ={40}
                as="div"
                className="mt-3 space-y-2 text-lg font-medium leading-relaxed text-slate-700 dark:text-white/90"
              >
                <p className="text-slate-900 dark:text-white text-right">{hero.tagline}</p>
                {hero.roles.map((role) => (
                  <p key={role.label} className="text-slate-700 dark:text-white/90 text-right">
                    {role.label}
                  </p>
                ))}
              </CardItem>
              <div
                aria-hidden="true"
                className="hidden sm:block bg-orange-400 w-16 h-16 absolute -left-8 -bottom-8 rounded-full dark:bg-[#8859eb] dark:border-4 dark:border-white"
              />
            </CardBody>
          </CardContainer>
        </div>

        {/* 纸飞机滚动路径：从 Hero 底部飞向下一个板块 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-40%] z-40 h-[140%]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 820"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="hero-plane-path-gradient"
                x1="722.156"
                y1="-228.339"
                x2="92.39"
                y2="704.889"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0.15" stopColor="#FFE9FE" />
                <stop offset="1" stopColor="#FF96F9" />
              </linearGradient>
            </defs>

            <path
              ref={planePathRef}
              d="M-92 17.713C62.32 254.966 256.7 504.626 493.407 484.643c137.542-17.257 247.733-123.595 279.259-239.307 27.368-100.43-21.323-229.59-140.017-241.76-118.693-12.172-208.268 98.897-231.122 199.803C366.854 354.712 413.851 515.68 526.623 632.453 639.395 749.225 815.268 819.528 995 819"
              stroke="url(#hero-plane-path-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeMiterlimit={10}
            />
          </svg>

          <div ref={planeContainerRef} className="absolute bottom-10 right-4 sm:right-16 md:right-24">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 309 152"
              className="h-20 w-28 sm:h-24 sm:w-32 md:h-28 md:w-40"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="hero-plane-body-a"
                  x1="66.623"
                  y1="2.042"
                  x2="112.939"
                  y2="199.069"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.27" stopColor="#FEC5FB" />
                  <stop offset="0.84" stopColor="#00BAE2" />
                </linearGradient>
                <linearGradient
                  id="hero-plane-body-b"
                  x1="-18.792"
                  y1="49.95"
                  x2="-15.789"
                  y2="152.351"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.27" stopColor="#FEC5FB" />
                  <stop offset="0.84" stopColor="#00BAE2" />
                </linearGradient>
              </defs>

              <g>
                {/* 机身（保持稳定，只跟随路径旋转） */}
                <path fill="#F5A9FF" d="m82.78 35.086 215.877 94.559L79 92l3.78-56.914Z" />

                {/* 左右机翼：单独成组，用于做轻微颤动 */}
                <g ref={leftWingRef}>
                  <path
                    fill="url(#hero-plane-body-a)"
                    d="m82.781 35.085 52.044-23.564 163.833 118.123-215.877-94.56Z"
                  />
                </g>
                <g ref={rightWingRef}>
                  <path
                    fill="url(#hero-plane-body-b)"
                    d="M298.777 130.425 1.903 103.302l53.998-44.957 242.876 72.08Z"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}