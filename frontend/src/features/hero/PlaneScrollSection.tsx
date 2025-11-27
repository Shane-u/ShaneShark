import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

let registered = false

const registerGsapPlugins = () => {
  if (registered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)
  registered = true
}

export function PlaneScrollSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const planeRef = useRef<SVGSVGElement | null>(null)

  useLayoutEffect(() => {
    if (!sectionRef.current || !pathRef.current || !planeRef.current) return

    registerGsapPlugins()

    const ctx = gsap.context(() => {
      const path = pathRef.current!
      const plane = planeRef.current!

      const pathLength = path.getTotalLength()

      // 初始化路径为“没被画出来”的状态
      gsap.set(path, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
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

      // 路径被画出来
      tl.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
      })

      // 飞机沿着相同路径飞行
      tl.to(
        plane,
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="Gentle breeze scroll animation"
      className="relative flex min-h-screen items-start justify-center overflow-hidden bg-slate-950 px-6 pb-24 pt-24 text-slate-50"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <h2 className="pointer-events-none select-none text-left text-5xl font-black leading-tight sm:text-6xl md:text-7xl">
          It&apos;s like a
          <br />
          gentle breeze
        </h2>

        <div className="relative mt-10 flex-1">
          {/* SVG 画出弧线 */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 820"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="plane-path-gradient"
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
              ref={pathRef}
              d="M-92 17.713C62.32 254.966 256.7 504.626 493.407 484.643c137.542-17.257 247.733-123.595 279.259-239.307 27.368-100.43-21.323-229.59-140.017-241.76-118.693-12.172-208.268 98.897-231.122 199.803C366.854 354.712 413.851 515.68 526.623 632.453 639.395 749.225 815.268 819.528 995 819"
              stroke="url(#plane-path-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeMiterlimit={10}
            />
          </svg>

          {/* 纸飞机本体，起点放在左上角，后续交给 GSAP 沿路径运动 */}
          <div className="pointer-events-none absolute bottom-10 right-4 translate-y-10 sm:right-16 md:right-24">
            <svg
              ref={planeRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 309 152"
              className="h-20 w-28 sm:h-24 sm:w-32 md:h-28 md:w-40"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="plane-body-a"
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
                  id="plane-body-b"
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
                <path fill="#F5A9FF" d="m82.78 35.086 215.877 94.559L79 92l3.78-56.914Z" />
                <path fill="url(#plane-body-a)" d="m82.781 35.085 52.044-23.564 163.833 118.123-215.877-94.56Z" />
                <path fill="url(#plane-body-b)" d="M298.777 130.425 1.903 103.302l53.998-44.957 242.876 72.08Z" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}


