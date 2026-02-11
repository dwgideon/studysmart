
export default function NotesList({ notes = [] }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 mt-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">My Notes</h3>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">+ Add Note</button>
      </div>
      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes available.</p>
        ) : (
          notes.map((note, index) => (
            <div key={index} className="border p-3 rounded flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{note.title}</h4>
                <p className="text-sm text-gray-500">{note.tag}</p>
              </div>
              <div className="space-x-2">
                <button className="text-blue-500 hover:underline">✏</button>
                <button className="text-red-500 hover:underline">🗑</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

