import CircleList from '@/components/CircleList'

export default function CirclesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Circles</h1>
          <p className="text-gray-600 dark:text-gray-300">Your groups and communities</p>
        </div>
        <CircleList />
      </div>
    </main>
  )
}
