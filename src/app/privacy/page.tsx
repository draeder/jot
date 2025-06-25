import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - Jot',
  description: 'Learn how Jot protects your privacy with local-only data storage and no tracking.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              Back to Jot
            </Link>
            <div className="text-gray-300 mx-4">|</div>
            <div className="flex items-center space-x-3">
              <Shield className="text-blue-600" size={20} />
              <span className="text-lg font-semibold text-gray-900">Privacy Policy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Effective Date: January 1, 2024</p>

        <div className="prose prose-lg max-w-none">
          <h2>Your Privacy is Our Priority</h2>
          <p>
            At Jot, we believe that your notes and thoughts are yours alone. That&apos;s why we&apos;ve built Jot 
            with privacy as the foundation, not an afterthought.
          </p>

          <h2>What We Don&apos;t Collect</h2>
          <ul>
            <li><strong>Your Notes Content</strong>: We never see or store your note content on our servers</li>
            <li><strong>Personal Information</strong>: No email addresses, phone numbers, or personal details required</li>
            <li><strong>Browsing History</strong>: We don&apos;t track your browsing habits or website usage</li>
            <li><strong>Analytics Data</strong>: No usage analytics, heatmaps, or behavioral tracking</li>
            <li><strong>Cookies</strong>: No advertising or tracking cookies</li>
          </ul>

          <h2>How Your Data is Stored</h2>
          <h3>Local Storage Only</h3>
          <p>
            All your data is stored locally in your browser using IndexedDB. This includes:
          </p>
          <ul>
            <li>Your chosen display name</li>
            <li>All workspaces and their organization</li>
            <li>All cards and their content</li>
            <li>Card positions and connections</li>
            <li>Your preferences (zoom levels, grid settings, etc.)</li>
          </ul>

          <h3>No Server-Side Storage</h3>
          <p>
            Jot does not upload, sync, or store any of your data on external servers. Your information 
            never leaves your device unless you explicitly export it.
          </p>

          <h2>What We Do Collect</h2>
          <h3>Essential Technical Information</h3>
          <p>
            To provide the service, we may collect minimal technical information:
          </p>
          <ul>
            <li><strong>Error Logs</strong>: Anonymous error reports to improve app stability (no personal data included)</li>
            <li><strong>Performance Metrics</strong>: Basic performance data to optimize the app (no user identification)</li>
          </ul>

          <h2>Third-Party Services</h2>
          <h3>No Third-Party Trackers</h3>
          <p>
            Jot does not use any third-party analytics, advertising networks, or tracking services.
          </p>

          <h3>Hosting and Infrastructure</h3>
          <p>
            Jot is hosted on secure cloud infrastructure. Our hosting providers may collect standard 
            web server logs (IP addresses, request timestamps) for security and operational purposes, 
            but this data is not linked to your Jot usage or content.
          </p>

          <h2>Data Security</h2>
          <ul>
            <li><strong>Local Encryption</strong>: Your browser&apos;s IndexedDB provides built-in encryption</li>
            <li><strong>HTTPS</strong>: All connections use secure HTTPS encryption</li>
            <li><strong>No Data Transmission</strong>: Since data stays local, there&apos;s no risk of transmission interception</li>
          </ul>

          <h2>Data Portability and Deletion</h2>
          <h3>Your Data, Your Control</h3>
          <ul>
            <li><strong>Access</strong>: All your data is accessible directly in the app</li>
            <li><strong>Export</strong>: Future versions will include data export features</li>
            <li><strong>Deletion</strong>: Clear your browser data to completely remove all Jot information</li>
          </ul>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Jot does not knowingly collect personal information from children under 13. Since we don&apos;t 
            collect personal information from anyone, this protection is built into our design.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy to reflect changes in our practices or for legal compliance. 
            Any changes will be posted on this page with an updated effective date.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our privacy practices, please contact us 
            through our support channels.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Privacy by Design</h3>
            <p className="text-blue-800">
              Privacy isn&apos;t just a policy at Jot—it&apos;s built into the very architecture of our application. 
              Your thoughts and ideas remain private because they never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
