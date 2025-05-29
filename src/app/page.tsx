export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
        📚 StudySmart AI
      </h1>
      <p className="mb-4 text-lg text-gray-600 text-center max-w-md">
        Upload your class notes or book pages. Let AI create study guides, quizzes, and games for you!
      </p>
      <input
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="mb-4 block w-full max-w-sm border rounded p-2"
      />
      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
        Generate Study Tools
      </button>
    </main>
  );
}
