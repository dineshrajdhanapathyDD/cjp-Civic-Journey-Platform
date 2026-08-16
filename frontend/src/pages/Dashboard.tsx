import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  FileText,
  Briefcase,
  Activity,
  TrendingUp,
  Shield,
  Brain,
  Search,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Users,
  Database,
  Zap,
  Target,
  MapPin,
} from 'lucide-react'
import { getDashboardStats, healthCheck } from '../services/api'
import IndiaLocationSelector from '../components/IndiaLocationSelector'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null)
  const [locationState, setLocationState] = useState('Tamil Nadu')
  const [locationCity, setLocationCity] = useState('')

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      healthCheck().catch(() => null),
    ]).then(([s, h]) => {
      setStats(s)
      setHealth(h)
    }).finally(() => setLoading(false))
  }, [])

  const metrics = [
    { label: 'Active Issues', value: stats?.open_issues ?? 0, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Currently tracked civic concerns' },
    { label: 'Citizen Reports', value: stats?.total_reports ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Reports submitted by citizens' },
    { label: 'Job Opportunities', value: stats?.total_jobs ?? 0, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50', desc: 'Opportunities linked to issues' },
    { label: 'Agent Actions', value: stats?.total_agent_actions ?? 0, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Actions performed by CJP agent' },
    { label: 'Evidence Records', value: stats?.total_evidence ?? 0, icon: Shield, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Supporting evidence tracked' },
    { label: 'Job Matches', value: stats?.total_job_matches ?? 0, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Opportunities matched to issues' },
  ]

  const journeySteps = [
    { icon: '🗣', title: 'Citizen Voice', desc: 'Submit a civic concern' },
    { icon: '🧠', title: 'AI Understanding', desc: 'Strands Agent analyzes the request' },
    { icon: '🪳', title: 'Persistent Memory', desc: 'CockroachDB connects related information' },
    { icon: '🔎', title: 'Semantic Search', desc: 'Vector Indexing finds similar reports' },
    { icon: '📋', title: 'Accountability', desc: 'Track actions and responses' },
    { icon: '💼', title: 'Opportunities', desc: 'Find relevant jobs and internships' },
    { icon: '✅', title: 'Action', desc: 'Take the next practical step' },
  ]

  const techCards = [
    { icon: Brain, title: 'Strands Agent', desc: 'AI reasoning and orchestration through Amazon Bedrock Nova Pro', color: 'text-purple-600' },
    { icon: Database, title: 'CockroachDB MCP', desc: 'Connects the agent to persistent database memory', color: 'text-green-600' },
    { icon: Search, title: 'Distributed Vector Indexing', desc: 'Finds semantically related civic reports and opportunities', color: 'text-blue-600' },
    { icon: Zap, title: 'CockroachDB Agent Skills', desc: 'Reusable database capabilities for agent actions', color: 'text-orange-600' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-civic-900 via-civic-800 to-civic-950 text-white p-8 lg:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold">CJP</span>
            <span className="text-civic-300 text-sm font-medium">Civic Journey Platform</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            From Citizen Voice to Accountable Action
          </h1>
          <p className="text-civic-200 text-lg max-w-2xl mb-6">
            Turn a civic concern into an actionable journey. Report a concern, connect related voices, understand its history, and discover practical next actions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/agent" className="inline-flex items-center gap-2 bg-white text-civic-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-civic-50 transition-colors">
              <MessageSquare size={18} />
              Report a Civic Concern
            </Link>
            <Link to="/agent" className="inline-flex items-center gap-2 bg-civic-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-civic-600 transition-colors border border-civic-600">
              <Brain size={18} />
              Ask Civic Agent
            </Link>
            <Link to="/issues" className="inline-flex items-center gap-2 bg-transparent text-civic-200 px-5 py-2.5 rounded-lg font-medium hover:bg-civic-800 transition-colors border border-civic-600">
              <AlertCircle size={18} />
              Explore Issues
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-civic-700 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-civic-600 rounded-full opacity-10 translate-y-1/2" />
      </section>

      {/* India Location Bar */}
      <section className="card flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <MapPin size={16} className="text-civic-500" />
          <span>India</span>
        </div>
        <IndiaLocationSelector
          state={locationState}
          city={locationCity}
          onStateChange={setLocationState}
          onCityChange={setLocationCity}
          compact
        />
        <span className="text-xs text-gray-400 ml-auto">Prototype Dataset</span>
      </section>

      {/* Metrics Grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Civic Pulse</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map(({ label, value, icon: Icon, color, bg, desc }) => (
            <div key={label} className="card py-4 px-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className={`${bg} p-2 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold">{loading ? '...' : value}</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-1 hidden lg:block">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Civic Journey Visual */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-1">The Civic Journey</h2>
        <p className="text-sm text-gray-500 mb-6">How CJP transforms a concern into accountable action</p>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-0">
          {journeySteps.map((step, i) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center text-center w-24 lg:w-28">
                <span className="text-2xl mb-1">{step.icon}</span>
                <p className="text-xs font-semibold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{step.desc}</p>
              </div>
              {i < journeySteps.length - 1 && (
                <ArrowRight size={16} className="text-gray-300 mx-1 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Start Your Civic Journey */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Start Your Civic Journey</h2>
        <p className="text-sm text-gray-500 mb-4">Choose what you want to do</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/agent" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-civic-200 group">
            <div className="bg-civic-50 p-3 rounded-lg w-fit mb-3 group-hover:bg-civic-100 transition-colors">
              <MessageSquare size={24} className="text-civic-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Report a Concern</h3>
            <p className="text-sm text-gray-500 mt-1">Submit a civic issue and get AI-powered analysis</p>
          </Link>
          <Link to="/issues" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200 group">
            <div className="bg-blue-50 p-3 rounded-lg w-fit mb-3 group-hover:bg-blue-100 transition-colors">
              <AlertCircle size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Explore an Issue</h3>
            <p className="text-sm text-gray-500 mt-1">View existing issues, timeline, and related reports</p>
          </Link>
          <Link to="/jobs" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-200 group">
            <div className="bg-green-50 p-3 rounded-lg w-fit mb-3 group-hover:bg-green-100 transition-colors">
              <Briefcase size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Find an Opportunity</h3>
            <p className="text-sm text-gray-500 mt-1">Discover jobs and internships linked to civic needs</p>
          </Link>
        </div>

        {/* Example Prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400">Try:</span>
          {[
            "There aren't enough technology jobs for graduates in my area.",
            "Has this issue already been reported?",
            "Find Python jobs for entry-level candidates.",
          ].map(p => (
            <Link key={p} to="/agent" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-civic-50 hover:text-civic-700 transition-colors">
              "{p}"
            </Link>
          ))}
        </div>
      </section>

      {/* Issues by Category */}
      {stats?.issues_by_category?.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Issues by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.issues_by_category.map((cat: any) => (
              <Link
                key={cat.category}
                to={`/issues?category=${cat.category}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-civic-50 transition-colors"
              >
                <span className="text-sm font-medium capitalize">{cat.category}</span>
                <span className="badge bg-civic-100 text-civic-800">{cat.cnt}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How CJP Works — Technology */}
      <section>
        <h2 className="text-lg font-semibold mb-1">How CJP Works Under the Hood</h2>
        <p className="text-sm text-gray-500 mb-4">The technology powering persistent civic intelligence</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techCards.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card py-4">
              <Icon size={22} className={color} />
              <h3 className="font-semibold text-sm mt-2">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span>+ ccloud CLI for CockroachDB Cloud operations</span>
          <span>+ Amazon Bedrock (Nova Pro + Titan Embed V2)</span>
        </div>
      </section>

      {/* System Status */}
      <section className="card">
        <h2 className="text-sm font-semibold mb-3 text-gray-600">System Status</h2>
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { label: 'Strands Agent', ok: true },
            { label: 'Amazon Bedrock', ok: true },
            { label: 'CockroachDB', ok: health?.database === 'connected' },
            { label: 'MCP Server', ok: health?.database === 'connected' },
            { label: 'Vector Search', ok: health?.database === 'connected' },
            { label: 'Job Matching', ok: health?.database === 'connected' },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className={ok ? 'text-gray-600' : 'text-red-500'}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Built With */}
      <section className="text-center py-4">
        <p className="text-xs text-gray-400">
          Built with CockroachDB Cloud + MCP Server + Distributed Vector Indexing + Agent Skills + ccloud CLI + Strands Agents + Amazon Bedrock
        </p>
        <p className="text-xs text-gray-300 mt-1">CockroachDB x AWS Hackathon</p>
      </section>
    </div>
  )
}
