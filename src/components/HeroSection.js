
export default function HeroSection() {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Your AI-Powered Learning Companion</h1>
        <p className="mb-6 text-lg">Generate smart flashcards, quizzes, and games tailored to your study needs using artificial intelligence.</p>
        <div className="flex justify-center max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Enter a topic (e.g. Biology, Calculus, WWII)"
            className="w-full rounded-l-lg px-4 py-2 text-black"
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-r-lg font-semibold hover:bg-blue-700">
            Generate
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Supercharge Your Learning</h2>
        <p className="text-gray-600 mb-10">Choose from our powerful study tools to make learning more effective and fun.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6">
          {/* Flashcards */}
          <div className="bg-white border rounded-lg shadow p-6">
            <div className="text-blue-600 text-3xl mb-2">📘</div>
            <h3 className="font-semibold text-lg mb-1">Smart Flashcards</h3>
            <p className="text-sm text-gray-600 mb-4">AI-generated flashcards that adapt to your knowledge level and help you focus on what matters.</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">What is the powerhouse of the cell?</p>
              <div className="flex justify-between">
                <button className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">✗ Hard</button>
                <button className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">✓ Easy</button>
              </div>
            </div>
          </div>

          {/* Quizzes */}
          <div className="bg-white border rounded-lg shadow p-6">
            <div className="text-purple-600 text-3xl mb-2">❓</div>
            <h3 className="font-semibold text-lg mb-1">Interactive Quizzes</h3>
            <p className="text-sm text-gray-600 mb-4">Test your knowledge with adaptive quizzes that get smarter as you use them.</p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="mb-2 font-medium">Which planet is known as the Red Planet?</p>
              {["Venus", "Mars", "Jupiter", "Saturn"].map((opt, i) => (
                <div key={i} className="border p-2 rounded mb-2 hover:bg-gray-100 cursor-pointer">{opt}</div>
              ))}
            </div>
          </div>

          {/* Games */}
          <div className="bg-white border rounded-lg shadow p-6">
            <div className="text-green-600 text-3xl mb-2">🎮</div>
            <h3 className="font-semibold text-lg mb-1">Learning Games</h3>
            <p className="text-sm text-gray-600 mb-4">Make studying fun with our collection of educational games powered by your study material.</p>
            <p className="text-sm font-medium">Matching Pairs Game <span className="text-gray-400 float-right">Pairs: 0/8</span></p>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="bg-gray-100 py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-2">Track Your Progress</h2>
        <p className="text-center text-gray-600 mb-8">Visualize your learning journey and identify areas that need more attention.</p>
        <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
          <div className="flex justify-between mb-4 text-sm font-medium text-gray-700">
            <div>Subject Mastery</div>
            <div>Study Activity</div>
          </div>
          <div className="h-32 bg-gray-50 rounded mb-4"></div>
          <div className="text-sm text-gray-500 mt-4">Recommended Study Topics:</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Cellular Biology", "Trigonometry", "World War II", "French Revolution", "Organic Chemistry"].map((topic, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">{topic}</span>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-blue-500 text-5xl mb-6">🤖</div>
          <h2 className="text-2xl font-bold mb-4">How Our AI Works</h2>
          <p className="text-gray-600 mb-6">StudySmart uses advanced natural language processing to analyze educational content and generate study materials that match your learning needs.</p>
          <ul className="text-left list-disc list-inside text-gray-700 space-y-2">
            <li>✅ Adaptive learning based on your progress</li>
            <li>✅ Content curated from reliable educational sources</li>
            <li>✅ Spaced repetition algorithms for better retention</li>
            <li>✅ Real-time performance tracking</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 text-center text-sm">
        <div className="font-bold mb-1">StudySmart</div>
        <p className="mb-2">Making learning smarter, not harder.</p>
        <div className="flex justify-center gap-6 text-xs">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Features</a>
          <a href="#" className="hover:underline">Pricing</a>
          <a href="#" className="hover:underline">Contact</a>
        </div>
        <div className="mt-4 border-t border-white/30 pt-2">© 2025 StudySmart. All rights reserved.</div>
      </footer>
    </div>
  );
}

