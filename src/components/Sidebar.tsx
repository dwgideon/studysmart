export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r p-6">
      <h2 className="text-xl font-bold mb-6">StudySmart</h2>

      <nav className="space-y-4">
        <a href="/dashboard" className="block text-gray-700 hover:text-blue-600">
          Dashboard
        </a>
        <a href="/practice" className="block text-gray-700 hover:text-blue-600">
          Practice
        </a>
        <a href="/games" className="block text-gray-700 hover:text-blue-600">
          Games
        </a>
        <a href="/profile" className="block text-gray-700 hover:text-blue-600">
          Profile
        </a>
      </nav>
    </aside>
  );
}
