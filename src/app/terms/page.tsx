import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - Jot',
  description: 'Terms of service for using Jot visual note-taking workspace.',
}

export default function TermsPage() {
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
              <FileText className="text-blue-600" size={20} />
              <span className="text-lg font-semibold text-gray-900">Terms of Service</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Effective Date: January 1, 2024</p>

        <div className="prose prose-lg max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Jot (&quot;the Service&quot;), you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <h3>Permission is granted to temporarily use Jot for personal and commercial purposes.</h3>
          <p>This is the grant of a license, not a transfer of title, and under this license you may:</p>
          <ul>
            <li>Use the Service for creating and managing visual notes</li>
            <li>Use the Service for personal, educational, or commercial purposes</li>
            <li>Access all features available in the application</li>
          </ul>

          <h3>This license shall automatically terminate if you violate any of these restrictions.</h3>

          <h2>3. Acceptable Use</h2>
          <h3>You agree not to use Jot to:</h3>
          <ul>
            <li>Store or share illegal, harmful, or offensive content</li>
            <li>Violate any applicable local, state, national, or international law</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            <li>Use the Service to harass, abuse, or harm others</li>
          </ul>

          <h2>4. Privacy and Data</h2>
          <h3>Your Content Ownership</h3>
          <p>
            You retain full ownership of all content you create in Jot. We do not claim any ownership 
            rights over your notes, ideas, or creations.
          </p>

          <h3>Local Storage</h3>
          <p>
            As outlined in our Privacy Policy, all your data is stored locally in your browser. 
            We do not have access to your content and cannot recover lost data.
          </p>

          <h2>5. Service Availability</h2>
          <h3>Free Service</h3>
          <p>
            Jot is provided free of charge. We strive to maintain high availability but do not 
            guarantee uninterrupted access to the Service.
          </p>

          <h3>No Data Recovery</h3>
          <p>
            Since data is stored locally, we cannot recover lost data due to browser issues, 
            device problems, or user actions. Users are responsible for backing up their own data.
          </p>

          <h2>6. Disclaimers</h2>
          <h3>As Is Service</h3>
          <p>
            The Service is provided &quot;as is&quot; without any representations or warranties, express or implied. 
            We make no representations or warranties about the accuracy, reliability, completeness, 
            currentness, or timeliness of the Service.
          </p>

          <h2>7. Limitations of Liability</h2>
          <p>
            In no event shall Jot or its suppliers be liable for any damages (including, without 
            limitation, damages for loss of data or profit, or due to business interruption) arising 
            out of the use or inability to use Jot, even if we have been notified orally or in writing 
            of the possibility of such damage.
          </p>

          <h2>8. Accuracy of Materials</h2>
          <p>
            The materials in Jot could include technical, typographical, or photographic errors. 
            We do not warrant that any of the materials are accurate, complete, or current.
          </p>

          <h2>9. Links</h2>
          <p>
            Jot may contain links to third-party websites or services. We are not responsible for 
            the contents of any linked site and do not endorse any site.
          </p>

          <h2>10. Modifications</h2>
          <h3>Service Changes</h3>
          <p>
            We may revise these terms of service at any time without notice. By using this Service, 
            you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h3>Feature Updates</h3>
          <p>
            We may modify, suspend, or discontinue any aspect of the Service at any time, including 
            the availability of any Service feature, without notice.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of 
            the jurisdiction where the Service is operated, and you irrevocably submit to the exclusive 
            jurisdiction of the courts in that state or location.
          </p>

          <h2>12. Support and Donations</h2>
          <h3>Community Support</h3>
          <p>
            Support is provided on a best-effort basis through our documentation and community channels.
          </p>

          <h3>Voluntary Donations</h3>
          <p>
            While Jot is free to use, voluntary donations through &quot;Buy me a coffee&quot; or similar platforms 
            help support continued development. Donations are voluntary and do not create any obligation 
            for additional services.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us through our 
            available support channels.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Simple Terms</h3>
            <p className="text-green-800">
              In simple terms: Use Jot responsibly, respect others, and remember that your data stays 
              on your device. We provide the tool for free, you own your content, and we all benefit 
              from a respectful community.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
