export default function StatCard({ label, value, delta, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 w-full max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-600 font-medium">{label}</h4>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className={`text-sm mt-1 ${delta.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {delta} from last week
      </div>
    </div>
  );
}

