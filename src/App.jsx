import React, { useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth, UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { setClerkTokenProvider } from './graphql/client.js';

const ME_QUERY = gql`
  query GetMe {
    me {
      id
      displayName
      emailAddress
      center {
        name
      }
      role {
        name
      }
    }
  }
`;

function App() {
  const { getToken } = useAuth();

  // Bind Clerk's token fetching to our Apollo Client configuration
  useEffect(() => {
    setClerkTokenProvider(getToken);
  }, [getToken]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-rose-50 to-orange-100 text-slate-800 font-sans antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-rose-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-200">
            ☀️
          </div>
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 text-xl tracking-tight">
              Divine Garbh Sanskar
            </h1>
            <p className="text-[10px] text-rose-400 font-semibold tracking-wider uppercase">Nurturing Life Within</p>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <SignedIn>
            <div className="flex items-center gap-4">
              <ApolloUserProfile />
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all duration-300 transform hover:-translate-y-0.5">
                Sign In / Join
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <SignedOut>
          {/* Welcome Screen for Unauthenticated Users */}
          <div className="text-center py-20 max-w-2xl mx-auto">
            <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">Welcome Mother & Parent</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mt-6 leading-tight">
              Begin Your Sacred Journey of <span className="text-orange-500">Conscious Pregnancy</span>
            </h2>
            <p className="text-slate-600 mt-6 text-lg leading-relaxed">
              Unlock ancient wisdom combined with modern science. Practice yoga, listen to classical meditation melodies, log positive readings, and track baby growth daily.
            </p>
            <div className="mt-10">
              <SignInButton mode="modal">
                <button className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-lg shadow-xl shadow-rose-200 hover:scale-105 transition-all duration-300">
                  Access Your Dashboard
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Dashboard for Signed In Users */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: Tracker and Activities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Mother & Baby Greeting */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-15 text-[150px]">👶</div>
                <h3 className="text-2xl md:text-3xl font-extrabold">Hello, Beautiful Mother!</h3>
                <p className="mt-2 text-orange-50/90 text-sm leading-relaxed">
                  You are currently in your <strong className="text-white">Week 24 of pregnancy</strong>. Your baby is the size of an ear of corn and is starting to open their eyes!
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-semibold">
                    📅 EDD: Oct 28, 2026
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-semibold">
                    🌱 Trimester: 2nd
                  </div>
                </div>
              </div>

              {/* Daily Tracker Checklist */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>✅</span> Today's Garbh Sanskar Rituals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-rose-50 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-start gap-4">
                    <span className="text-3xl">🧘‍♀️</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Garbh Yoga & Pranayam</h4>
                      <p className="text-xs text-slate-500 mt-1">Gentle stretching and breathing for easy delivery.</p>
                      <button className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-600">Start (15 min) →</button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-rose-50 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-start gap-4">
                    <span className="text-3xl">🎵</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Garbh Sanskar Sangeet</h4>
                      <p className="text-xs text-slate-500 mt-1">Calming ragas to enhance brain development.</p>
                      <button className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-600">Play Audio →</button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-rose-50 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-start gap-4">
                    <span className="text-3xl">📚</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Inspirational Reading</h4>
                      <p className="text-xs text-slate-500 mt-1">Read optimistic stories for a positive mindset.</p>
                      <button className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-600">Read Chapter →</button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-rose-50 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-start gap-4">
                    <span className="text-3xl">🥗</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Nutritional Diet Plan</h4>
                      <p className="text-xs text-slate-500 mt-1">Iron and Calcium-rich satvik recipes.</p>
                      <button className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-600">View Menu →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Programs & Consultations */}
            <div className="space-y-8">
              {/* Consultation Details */}
              <div className="p-6 rounded-3xl bg-white border border-rose-50 shadow-md">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>👩‍⚕️</span> Your Dedicated Guides
                </h3>
                <p className="text-xs text-slate-500 mt-1">Reach out to your assigned Garbh Sanskar expert.</p>
                <div className="mt-4 border-t border-rose-50 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Dr. Sunita Sharma</h4>
                      <p className="text-[10px] text-orange-500 font-semibold">Chief Garbh Sanskar Trainer</p>
                    </div>
                    <button className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-full text-xs font-bold transition-all">
                      Chat
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Mrs. Priya Patel</h4>
                      <p className="text-[10px] text-rose-500 font-semibold">Prenatal Yoga Expert</p>
                    </div>
                    <button className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-bold transition-all">
                      Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Affirmation Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-xl text-center">
                <span className="text-xs font-bold tracking-widest uppercase opacity-75">Daily Affirmation</span>
                <p className="italic text-lg font-medium mt-3 leading-relaxed">
                  "I am filled with love, peace, and strength. My baby feels safe, healthy, and cherished."
                </p>
              </div>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}

// Sub-component to trigger ME_QUERY via Apollo Client and display viewer profile info
function ApolloUserProfile() {
  const { data, loading, error } = useQuery(ME_QUERY);

  if (loading) return <span className="text-xs text-slate-400 animate-pulse">Loading profile...</span>;
  if (error) return <span className="text-xs text-rose-400">Not synced</span>;
  if (!data?.me) return null;

  return (
    <div className="text-right">
      <p className="font-bold text-sm text-slate-800">{data.me.displayName}</p>
      <p className="text-[10px] text-rose-400 font-medium">{data.me.role?.name} @ {data.me.center?.name || 'Central'}</p>
    </div>
  );
}

export default App;
