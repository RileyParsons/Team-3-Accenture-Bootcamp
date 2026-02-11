import { PiggyBank, TrendingUp, ShoppingCart, Fuel } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <nav className="px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">SaveSmart</span>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Personal Savings Agent
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ask questions about your finances and get real, actionable savings advice 
            powered by live Australian pricing data. Perfect for university students and young people.
          </p>
          <Link href="/onboarding">
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
              Get Started Free
            </button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <ShoppingCart className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Smart Grocery Planning</h3>
            <p className="text-gray-600">
              Get meal plans based on current Coles & Woolworths specials. Save 15-20% on groceries.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Fuel className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Fuel Optimization</h3>
            <p className="text-gray-600">
              Find the cheapest fuel within 5km using live FuelCheck data. Save $60+ monthly.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Personal Finance Goals</h3>
            <p className="text-gray-600">
              Create savings plans for your goals. Track progress and get personalized recommendations.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Example Conversation</h2>
            <p className="text-gray-600">See how Sarah saves $3,000 for her Japan trip</p>
          </div>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex justify-end">
              <div className="bg-green-600 text-white p-4 rounded-lg max-w-md">
                "I want to save $3000 in 6 months for a Japan trip"
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-4 rounded-lg max-w-md">
                That's $500/month. Based on your profile, I found $300/month in savings opportunities:
                <br />• Grocery meal planning: $120/month
                <br />• Fuel optimization: $60/month  
                <br />• Cancel unused Netflix: $50/month
                <br />• Reduce café coffees: $70/month
                <br /><br />You can reach your goal! 🎯
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Saving?</h2>
          <p className="text-gray-600 mb-8">Join thousands of Australian students saving money with AI</p>
          <Link href="/onboarding">
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
              Start Your Savings Journey
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
