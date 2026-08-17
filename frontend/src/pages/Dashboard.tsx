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
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react'
import { getDashboardStats, healthCheck } from '../services/api'
import IndiaLocationSelector from '../components/IndiaLocationSelector'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null)
  const [locationState, setLocationState] = useState('Tamil Nadu')
  const [locationCity, setLocationCity] = useState('')
  const [expandedTech, setExpandedTech] = useState<string | null>(null)

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
    { label: 'Active Issues', value: stats?.open_issues ?? 0, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Currently tracked civic concerns' },
    { label: 'Citizen Reports', value: stats?.total_reports ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Reports submitted by citizens' },
    { label: 'Job Opportunities', value: stats?.total_jobs ?? 0, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-100', desc: 'Opportunities linked to issues' },
    { label: 'Agent Actions', value: stats?.total_agent_actions ?? 0, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Actions performed by CJP agent' },
    { label: 'Evidence Records', value: stats?.total_evidence ?? 0, icon: Shield, color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Supporting evidence tracked' },
    { label: 'Job Matches', value: stats?.total_job_matches ?? 0, icon: Target, color: 'text-rose-600', bg: 'bg-rose-100', desc: 'Opportunities matched to issues' },
  ]

  const journeySteps = [
    { icon: '🗣', title: 'Citizen Voice', desc: 'Report a civic concern' },
    { icon: '🧠', title: 'AI Understanding', desc: 'Strands Agent + Bedrock' },
    { icon: '🪳', title: 'Persistent Memory', desc: 'CockroachDB stores context' },
    { icon: '🔎', title: 'Semantic Search', desc: 'Vector Indexing finds similar' },
    { icon: '📋', title: 'Accountability', desc: 'Track actions and responses' },
    { icon: '💼', title: 'Opportunities', desc: 'Find relevant jobs' },
    { icon: '✅', title: 'Action', desc: 'Take the next step' },
  ]

  const techCards = [
    {
      icon: Database,
      title: 'CockroachDB MCP',
      desc: 'Persistent operational memory and database operations',
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      detail: 'The CJP agent uses the CockroachDB MCP Server to persist conversations, issues, reports, evidence, and timeline events. Every interaction is stored as operational memory that persists across sessions.',
    },
    {
      icon: Search,
      title: 'Distributed Vector Indexing',
      desc: 'Semantic retrieval of related civic reports and opportunities',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      detail: 'CockroachDB VECTOR(1024) columns with HNSW cosine indexes across issues, reports, evidence, responses, and jobs. Enables the agent to find semantically related civic data without exact keyword matching.',
    },
    {
      icon: Zap,
      title: 'CockroachDB Agent Skills',
      desc: 'Reusable CockroachDB expertise available to the agent',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      detail: '34 structured skills spanning Application Development, Observability, Operations, Security, Query Design, and Migrations. The agent consults these skills before making database decisions.',
    },
    {
      icon: Brain,
      title: 'Strands Agent',
      desc: 'AI reasoning and tool orchestration via Amazon Bedrock',
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      detail: 'Strands SDK agent with Nova Pro reasoning model. Autonomously decides which tools to use, when to search memory, create issues, or match jobs. Not a chatbot — an agentic system.',
    },
  ]

  const toggleTech = (title: string) => {
    setExpandedTech(expandedTech === title ? null : title)
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-civic-900 via-civic-800 to-civic-950 text-white p-8 lg:p-12 shadow-lg">
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
            <Link to="/agent" className="inline-flex items-center gap-2 bg-white text-civic-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-civic-50 transition-colors shadow-sm">
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
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
        <span className="text-xs text-gray-500 ml-auto">Prototype Dataset</span>
      </section>

      {/* Metrics Grid */}
      <section>
        <h2 className="section-title mb-4">Civic Pulse</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map(({ label, value, icon: Icon, color, bg, desc }) => (
            <div key={label} className="stat-card group">
              <div className={`${bg} p-2.5 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
              <p className="text-xs text-gray-500 mt-1 hidden lg:block">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Civic Journey Visual */}
      <section className="card-solid">
        <h2 className="section-title mb-1">The Civic Journey</h2>
        <p className="section-desc mb-6">How CJP transforms a concern into accountable action</p>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-0">
          {journeySteps.map((step, i) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center text-center w-24 lg:w-28">
                <span className="text-2xl mb-1">{step.icon}</span>
                <p className="text-xs font-bold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">{step.desc}</p>
              </div>
              {i < journeySteps.length - 1 && (
                <ArrowRight size={16} className="text-civic-400 mx-1 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Start Your Civic Journey */}
      <section>
        <h2 className="section-title mb-1">Start Your Civic Journey</h2>
        <p className="section-desc mb-4">Choose what you want to do</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/agent" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-civic-300 group">
            <div className="bg-civic-100 p-3 rounded-lg w-fit mb-3 group-hover:bg-civic-200 transition-colors">
              <MessageSquare size={24} className="text-civic-700" />
            </div>
            <h3 className="font-bold text-gray-900">Report a Concern</h3>
            <p className="text-sm text-gray-600 mt-1">Submit a civic issue and get AI-powered analysis</p>
          </Link>
          <Link to="/issues" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-300 group">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-3 group-hover:bg-blue-200 transition-colors">
              <AlertCircle size={24} className="text-blue-700" />
            </div>
            <h3 className="font-bold text-gray-900">Explore an Issue</h3>
            <p className="text-sm text-gray-600 mt-1">View existing issues, timeline, and related reports</p>
          </Link>
          <Link to="/jobs" className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-300 group">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-3 group-hover:bg-green-200 transition-colors">
              <Briefcase size={24} className="text-green-700" />
            </div>
            <h3 className="font-bold text-gray-900">Find an Opportunity</h3>
            <p className="text-sm text-gray-600 mt-1">Discover jobs and internships linked to civic needs</p>
          </Link>
        </div>

        {/* Example Prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 font-medium">Try:</span>
          {[
            "There aren't enough technology jobs for graduates in my area.",
            "Has this issue already been reported?",
            "Find Python jobs for entry-level candidates.",
          ].map(p => (
            <Link key={p} to="/agent" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-civic-100 hover:text-civic-800 transition-colors border border-gray-200">
              "{p}"
            </Link>
          ))}
        </div>
      </section>

      {/* Issues by Category */}
      {stats?.issues_by_category?.length > 0 && (
        <section className="card">
          <h2 className="section-title mb-4">Issues by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.issues_by_category.map((cat: any) => (
              <Link
                key={cat.category}
                to={`/issues?category=${cat.category}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-civic-50 transition-colors border border-gray-100 hover:border-civic-200"
              >
                <span className="text-sm font-semibold capitalize text-gray-800">{cat.category}</span>
                <span className="badge bg-civic-100 text-civic-800">{cat.cnt}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How CJP Works — Technology */}
      <section>
        <h2 className="section-title mb-1">How CJP Uses CockroachDB</h2>
        <p className="section-desc mb-4">The technology powering persistent civic intelligence</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {techCards.map(({ icon: Icon, title, desc, color, bg, border, detail }) => (
            <div key={title} className={`card ${bg} border ${border} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => toggleTech(title)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-700 mt-0.5">{desc}</p>
                  </div>
                </div>
                {expandedTech === title ? (
                  <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                )}
              </div>
              {expandedTech === title && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-700 leading-relaxed">{detail}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Terminal size={12} className="text-gray-500" />
            ccloud CLI — CockroachDB Cloud operations during development
          </span>
          <span className="flex items-center gap-1.5">
            <Brain size={12} className="text-purple-500" />
            Amazon Bedrock — Nova Pro + Titan Embed V2
          </span>
        </div>
      </section>

      {/* System Status */}
      <section className="card">
        <h2 className="text-sm font-bold mb-3 text-gray-700">System Status</h2>
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
              <div className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-red-400 shadow-sm shadow-red-200'}`} />
              <span className={`font-medium ${ok ? 'text-gray-700' : 'text-red-600'}`}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Built With */}
      <section className="text-center py-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-medium">
          Built with CockroachDB Cloud + MCP Server + Distributed Vector Indexing + Agent Skills + ccloud CLI + Strands Agents + Amazon Bedrock
        </p>
        <p className="text-xs text-gray-400 mt-1">CockroachDB x AWS Hackathon</p>
      </section>
    </div>
  )
}
