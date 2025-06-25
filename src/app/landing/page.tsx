import Link from 'next/link'
import Image from 'next/image'
import JsonLd from '@/components/json-ld'
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Infinity, 
  Search, 
  Edit3,
  GitBranch,
  Coffee,
  CheckCircle,
  Users,
  Palette,
  Code,
  BookOpen
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Image 
                src="/jotlogo.png" 
                alt="Jot Logo" 
                width={150} 
                height={75}
                className="object-contain"
              />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-800 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-800 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-800 hover:text-gray-900 transition-colors">Pricing</a>
              <Link href="/docs" className="text-gray-800 hover:text-gray-900 transition-colors">Docs</Link>
            </nav>
            <Link 
              href="/auth/signin"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Visual
              <span className="text-blue-600 block">Note-Taking Workspace</span>
            </h1>
            <p className="text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
              Create, organize, and connect your ideas in an infinite canvas. 
              Rich text editing, visual connections, and complete privacy - all free forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signin"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center gap-2"
              >
                Start Creating Now
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for visual thinking
            </h2>
            <p className="text-xl text-gray-800">
              Powerful features designed for students, professionals, and teams
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Infinity className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Infinite Canvas</h3>
              <p className="text-gray-800">
                Unlimited workspace for your ideas. Pan, zoom, and organize without boundaries.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Edit3 className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Rich Text Editing</h3>
              <p className="text-gray-800">
                Full formatting, code highlighting, images, lists, and interactive task management.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Visual Connections</h3>
              <p className="text-gray-800">
                Connect ideas with arrows and lines. Perfect for mind maps and workflows.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Global Search</h3>
              <p className="text-gray-800">
                Find content across all workspaces instantly with real-time search.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Complete Privacy</h3>
              <p className="text-gray-800">
                All data stored locally in your browser. No servers, no tracking, no compromises.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">No Signup Required</h3>
              <p className="text-gray-800">
                Just enter your name and start creating. No accounts, no passwords, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get started in seconds
            </h2>
            <p className="text-xl text-gray-800">
              No complex setup. Just pure creativity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Enter Your Name</h3>
              <p className="text-gray-800">
                No account creation needed. Just tell us what to call you.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Create Your First Card</h3>
              <p className="text-gray-800">
                Double-click anywhere or use the Add Card button to start.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Start Creating</h3>
              <p className="text-gray-800">
                Drag, resize, connect, and organize your ideas however you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect for every visual thinker
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Users className="text-blue-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Project Planning</h3>
              <p className="text-gray-800 text-sm">
                Map out project workflows and track progress visually.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <BookOpen className="text-green-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Research Notes</h3>
              <p className="text-gray-800 text-sm">
                Connect research findings and build knowledge graphs.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Code className="text-purple-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Code Documentation</h3>
              <p className="text-gray-800 text-sm">
                Document APIs, architectures, and code examples with syntax highlighting.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Palette className="text-orange-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Creative Brainstorming</h3>
              <p className="text-gray-800 text-sm">
                Generate and organize ideas in visual mind maps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-xl text-gray-800">
              Free forever. No hidden costs. No subscriptions.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
                <div className="text-6xl font-bold text-blue-600 mb-2">$0</div>
                <p className="text-gray-800 mb-8">Per month, per user, per everything</p>
                
                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">Unlimited workspaces</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">Unlimited cards and connections</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">Rich text editing with code highlighting</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">Local data storage (complete privacy)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">Global search across all content</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                    <span className="text-gray-900">No ads, no tracking, no limits</span>
                  </li>
                </ul>

                <Link 
                  href="/auth/signin"
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center gap-2 mb-4"
                >
                  Get Started Now
                  <ArrowRight size={20} />
                </Link>

                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-800 mb-4">
                    Love Jot? Support its development!
                  </p>
                  <a 
                    href="https://coff.ee/draederg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                  >
                    <Coffee size={20} />
                    Buy me a coffee
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform your note-taking?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of users who have made Jot their visual thinking companion.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg inline-flex items-center gap-2"
          >
            Start Creating for Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image 
                  src="/jotlogo.png" 
                  alt="Jot Logo" 
                  width={60} 
                  height={30}
                  className="object-contain"
                />
              </div>
              <p className="text-gray-400">
                Visual note-taking workspace for everyone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><a href="https://coff.ee/draederg" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Buy me a coffee</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Jot. Made with ❤️ for visual thinkers.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
