import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Where Your Voice Creates Change
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-50">
              Join VOCH - the social platform that merges community engagement with civic action
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-secondary hover:bg-secondary-600 text-primary-900 font-semibold rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-text-primary">
            Everything You Need to Make an Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Social Feed"
              description="Share posts, reels, and stories with your community. Connect with like-minded individuals."
              icon="📱"
            />
            <FeatureCard
              title="Civic Polls"
              description="Create and participate in polls. Make your voice heard on issues that matter."
              icon="🗳️"
            />
            <FeatureCard
              title="NGO Support"
              description="Discover verified NGOs, support fundraisers, and contribute to causes you care about."
              icon="🤝"
            />
            <FeatureCard
              title="Gamification"
              description="Earn XP, unlock badges, and level up as you engage with your community."
              icon="🎯"
            />
            <FeatureCard
              title="Secure Messaging"
              description="End-to-end encrypted conversations. Your privacy is our priority."
              icon="🔒"
            />
            <FeatureCard
              title="Real-time Updates"
              description="Stay connected with instant notifications and live updates."
              icon="⚡"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Make Your Voice Count?
          </h2>
          <p className="text-xl mb-8 text-primary-50">
            Join thousands of users creating positive change in their communities
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-secondary hover:bg-secondary-600 text-primary-900 font-bold rounded-lg text-lg transition-colors"
          >
            Join VOCH Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">VOCH</h3>
              <p className="text-sm">Where your voice creates change</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 VOCH. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-surface rounded-xl shadow-card hover:shadow-card-hover transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}
