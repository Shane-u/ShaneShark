import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-xs uppercase tracking-[0.5em] text-slate-400">404</p>
      <h1 className="font-fantasy text-4xl text-slate-900">This story isn’t written yet.</h1>
      <p className="max-w-2xl text-slate-500">
        The page you are looking for does not exist. Return to the homepage or explore favorites for inspiration.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="rounded-full bg-accent px-6 py-3 font-semibold text-slate-900">
          Back home
        </Link>
        <Link to="/favorites" className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-600">
          Favorites
        </Link>
      </div>
    </div>
  )
}

