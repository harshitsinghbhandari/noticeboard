import { Button } from '../../../components/ui/Button';
import { useOpenings } from '../hooks/useOpenings';

export default function Openings() {
  const { openings, loading, filters, setFilters } = useOpenings();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Opportunities</h1>

      <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <select
          className="border p-2 rounded text-black"
          value={filters.job_type}
          onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
        >
          <option value="">All Job Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>

        <select
          className="border p-2 rounded text-black"
          value={filters.experience_level}
          onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
        >
          <option value="">All Experience Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="executive">Executive</option>
        </select>
      </div>

      {loading ? (
        <div>Loading openings...</div>
      ) : (
        <div className="space-y-4">
          {openings.map(opening => (
            <div key={opening.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-black">{opening.title}</h2>
                  <p className="text-blue-600 font-medium">{opening.body_name}</p>
                </div>
                <Button variant="primary">Apply</Button>
              </div>
              <p className="mt-2 text-gray-600 line-clamp-3">{opening.description}</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>📍 {opening.location_city}, {opening.location_country}</span>
                <span>💼 {opening.job_type}</span>
                <span>🎓 {opening.experience_level}</span>
              </div>
            </div>
          ))}
          {openings.length === 0 && (
            <div className="text-center py-10 text-gray-500">No openings found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
