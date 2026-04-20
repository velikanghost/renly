'use client'

import { useState, useEffect } from 'react'
import {
  Rocket,
  Zap,
  Shield,
  Terminal,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  Code2,
  Box,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        isDark ? 'dark bg-[#09090b] text-white' : 'bg-white text-gray-900',
      )}
    >
      <div className="fixed top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 z-50" />

      {/* Navbar */}
      <nav
        className={cn(
          'fixed top-1 left-0 w-full z-40 transition-all duration-300 border-b',
          scrolled
            ? isDark
              ? 'bg-[#09090b]/80 backdrop-blur-md border-white/10'
              : 'bg-white/80 backdrop-blur-md border-gray-200'
            : 'bg-transparent border-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Renly</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium">
            <a
              href="#features"
              className="hover:text-indigo-500 transition-colors"
            >
              Features
            </a>
            <a href="#docs" className="hover:text-indigo-500 transition-colors">
              Docs
            </a>
            <a
              href="https://github.com"
              className="hover:text-indigo-500 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              GitHub
            </a>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button className="px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="blur-dot bg-indigo-500 top-20 -left-20 opacity-20" />
        <div className="blur-dot bg-purple-500 bottom-20 -right-20 opacity-20" />

        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-8 relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
            >
              Scaffold and Deploy <br />
              <span className="hero-gradient italic">native to Locus Beta</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl max-w-2xl mx-auto text-gray-500 dark:text-gray-400"
            >
              Renly is the essential CLI companion for the BuildWithLocus
              ecosystem. Bootstrap in seconds, push to production in one
              command. Experience cloud native at the speed of thought.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-[#09090b] text-gray-300 rounded-lg pl-4 pr-1 py-1 font-mono text-sm border border-white/10">
                  <span className="text-indigo-500 mr-2">$</span>
                  <span>npm install -g @renly/cli</span>
                  <button className="ml-4 p-2 hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button className="flex items-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all transform hover:scale-105">
                Read Documentation
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CLI Demo Section */}
      <section className="py-20 bg-gray-50 dark:bg-white/2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                The CLI was built for you.
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Stop fighting with configurations. Renly handles the
                scaffolding, environment setup, and deployment lifecycle so you
                can focus on building features.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Zap,
                    title: 'Zero Config Scaffolding',
                    desc: 'Next.js and NestJS templates with production-ready Dockerfiles.',
                  },
                  {
                    icon: Rocket,
                    title: 'Git-Powered Deployments',
                    desc: 'Automatic remote setup. Just push to deploy.',
                  },
                  {
                    icon: Shield,
                    title: 'Secure by Default',
                    desc: 'Built-in auth handling and environment management.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-xl border border-transparent hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-10" />
              <div className="relative bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl font-mono text-sm">
                <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-white/40">Terminal</span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex gap-3">
                    <span className="text-green-400">~</span>
                    <span className="text-white">renly init my-project</span>
                  </div>
                  <div className="text-gray-400 ml-6">
                    ? Which template would you like to use?{' '}
                    <span className="text-indigo-400">Next.js</span>
                  </div>
                  <div className="text-green-400 ml-6">
                    ✓ Project <span className="font-bold">my-project</span>{' '}
                    initialized!
                  </div>
                  <div className="flex gap-3 pt-2">
                    <span className="text-green-400">~</span>
                    <span className="text-white">
                      cd my-project && renly deploy
                    </span>
                  </div>
                  <div className="text-indigo-400 ml-6">
                    ⠋ Preparing deployment...
                  </div>
                  <div className="text-indigo-400 ml-6">
                    ⠙ Pushing code to Locus Beta...
                  </div>
                  <div className="text-green-400 ml-6">
                    ✓ Deployment successful!
                  </div>
                  <div className="text-gray-400 ml-6">
                    View your project at:{' '}
                    <span className="underline text-indigo-400">
                      https://your-app.locus.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Docs Section */}
      <section id="docs" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Code2 className="w-6 h-6 text-indigo-500" />
                Documentation
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Everything you need to master the Renly workflows.
              </p>
              <ul className="space-y-2 font-medium">
                <li className="text-indigo-500 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Getting Started
                </li>
                <li className="hover:text-indigo-500 cursor-pointer flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-transparent" />
                  CLI Reference
                </li>
                <li className="hover:text-indigo-500 cursor-pointer flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-transparent" />
                  Deploying to Locus
                </li>
                <li className="hover:text-indigo-500 cursor-pointer flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-transparent" />
                  Environment Management
                </li>
              </ul>
            </div>

            <div className="col-span-2 bg-gray-50 dark:bg-white/4 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-xl font-bold mb-4">Installation</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Install the Renly CLI globally using your favorite package
                  manager.
                </p>
                <div className="bg-black/90 rounded-lg p-4 font-mono text-sm mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">npm</span>
                    <Layers className="w-4 h-4 text-gray-500" />
                  </div>
                  <code className="text-indigo-400">
                    npm install -g @renly/cli
                  </code>
                </div>

                <h3 className="text-xl font-bold mb-4">Authentication</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Login with your Locus API key to link your CLI to your
                  workspace.
                </p>
                <div className="bg-black/90 rounded-lg p-4 font-mono text-sm">
                  <code className="text-indigo-400">renly login</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <span className="font-bold">Renly</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; 2026 Renly ✦ Build with efficiency.
          </p>
          <div className="flex items-center gap-6">
            <Terminal className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <span className="text-gray-400 hover:text-white cursor-pointer text-sm">
              Terms
            </span>
            <span className="text-gray-400 hover:text-white cursor-pointer text-sm">
              Privacy
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
