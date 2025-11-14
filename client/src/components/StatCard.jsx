import React from 'react'

function StatCard({ label, value }) {
  return (
    <div className="bg-highlight-dark border border-highlight-light rounded-lg p-4 text-center">
      <p className="text-sm text-neutral-400 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

export default StatCard