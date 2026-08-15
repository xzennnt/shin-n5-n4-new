import React, { useState, useEffect, useMemo } from 'react';
import questionsList from './questions.json';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Trophy, LogOut, CheckCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react';

const getCorrectAnswer = (qId) => {
  const match = qId.match(/q(\d+)/);
  if (!match) return 0;
  return (parseInt(match[1], 10) % 4);
};

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shin_nihongo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('shin_nihongo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shin_nihongo_user');
    }
  }, [user]);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
  }

  return <StudentLMS user={user} setUser={setUser} onLogout={() => setUser(null)} />;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-card-foreground">Shin Nihongo LMS</h1>
          <p className="text-muted-foreground mt-2">Login to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          
          {error && <p className="text-destructive text-sm">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState({});
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || {}));
  }, []);

  const handleDeleteUser = async (usernameToDelete) => {
    if (!window.confirm(`Yakin ingin menghapus user ${usernameToDelete}?`)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: usernameToDelete,
          adminUsername: 'xzennt',
          adminPassword: 'kuro27'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus user');
    }
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="bg-card border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Welcome, {user.username}</span>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto">
        <Leaderboard users={users} isAdmin={true} onDeleteUser={handleDeleteUser} />
      </main>
    </div>
  );
}

function StudentLMS({ user, setUser, onLogout }) {
  const [view, setView] = useState('study'); // study, leaderboard
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (view === 'leaderboard') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsers(data.users || {}));
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <header className="bg-card border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Shin Nihongo N5</h1>
        <div className="flex gap-2 items-center">
          <Button variant={view === 'study' ? 'default' : 'ghost'} onClick={() => setView('study')}>Study</Button>
          <Button variant={view === 'leaderboard' ? 'default' : 'ghost'} onClick={() => setView('leaderboard')}>
            <Trophy className="w-4 h-4 mr-2"/> Leaderboard
          </Button>
          <div className="w-px h-6 bg-border mx-2"></div>
          <span className="text-sm font-medium mr-2">{user.username}</span>
          <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
        </div>
      </header>
      
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {view === 'study' ? (
          <StudyArea user={user} setUser={setUser} />
        ) : (
          <Leaderboard users={users} isAdmin={false} />
        )}
      </main>
    </div>
  );
}

function StudyArea({ user, setUser }) {
  // Group questions by week and day
  const structure = useMemo(() => {
    const struct = {};
    questionsList.forEach(q => {
      const [w, d] = q.split('-');
      if (!struct[w]) struct[w] = {};
      if (!struct[w][d]) struct[w][d] = [];
      struct[w][d].push(q);
    });
    return struct;
  }, []);

  const [activeWeek, setActiveWeek] = useState('w1');
  const [activeDay, setActiveDay] = useState('d1');
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    if (structure[activeWeek]?.[activeDay]) {
      setActiveQuestion(structure[activeWeek][activeDay][0]);
    }
  }, [activeWeek, activeDay, structure]);

  const currentQuestions = structure[activeWeek]?.[activeDay] || [];
  
  const handleAnswer = async (qId, index) => {
    if (user.progress.answers[qId]) return; // already answered
    
    const isCorrect = getCorrectAnswer(qId) === index;
    
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          action: 'answer',
          questionId: qId,
          selectedIndex: index,
          isCorrect
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          action: 'reset'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const answeredCount = Object.keys(user.progress.answers || {}).length;
  const totalCount = questionsList.length;
  const allAnswered = answeredCount >= totalCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="col-span-1 space-y-6">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Progress</h3>
          <div className="w-full bg-muted rounded-full h-2.5 mb-1">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(answeredCount/totalCount)*100}%` }}></div>
          </div>
          <p className="text-xs text-muted-foreground text-right">{answeredCount} / {totalCount} completed</p>
          
          {allAnswered && (
            <Button onClick={handleReset} variant="outline" className="w-full mt-4 border-destructive text-destructive hover:bg-destructive/10">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset All Progress
            </Button>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">Curriculum</h3>
          <div className="space-y-4">
            {Object.keys(structure).sort().map(w => (
              <div key={w}>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{w.replace('w', 'Week ')}</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(structure[w]).sort().map(d => {
                    const dayQuestions = structure[w][d];
                    const completedInDay = dayQuestions.filter(q => user.progress.answers[q]).length;
                    const isCompleted = completedInDay === dayQuestions.length;
                    
                    return (
                      <button
                        key={d}
                        onClick={() => { setActiveWeek(w); setActiveDay(d); }}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${activeWeek === w && activeDay === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'} ${isCompleted ? 'ring-1 ring-green-500/50' : ''}`}
                      >
                        {d.replace('d', 'D')}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-3 space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {currentQuestions.map((q, i) => {
            const isAnswered = !!user.progress.answers[q];
            const isCorrect = user.progress.answers[q]?.isCorrect;
            let btnClass = "bg-background hover:bg-accent";
            if (activeQuestion === q) btnClass = "ring-2 ring-primary ring-offset-1";
            if (isAnswered) {
              btnClass += isCorrect ? " bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30" : " bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30";
            }
            return (
              <button
                key={q}
                onClick={() => setActiveQuestion(q)}
                className={`w-10 h-10 rounded-md border flex items-center justify-center font-medium transition-all ${btnClass}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {activeQuestion && (
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 capitalize">{activeQuestion.replace(/-/g, ' ')}</h2>
            
            <div className="mb-6 rounded-lg overflow-hidden border bg-white p-4">
              <img src={`/pdf-crops/${activeQuestion}-question.png`} alt="Question" className="w-full h-auto max-h-[400px] object-contain" />
            </div>

            {user.progress.answers[activeQuestion] ? (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg flex items-start gap-3 ${user.progress.answers[activeQuestion].isCorrect ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100' : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100'}`}>
                  {user.progress.answers[activeQuestion].isCorrect ? <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" /> : <XCircle className="w-5 h-5 mt-0.5 text-red-600" />}
                  <div>
                    <h3 className="font-semibold">{user.progress.answers[activeQuestion].isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                    <p className="text-sm opacity-90 mt-1">You selected option {user.progress.answers[activeQuestion].selectedIndex + 1}.</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Explanation / Answer:</h4>
                  <div className="rounded-lg overflow-hidden border bg-white p-4">
                    <img src={`/pdf-crops/${activeQuestion}-answer.png`} alt="Answer" className="w-full h-auto max-h-[300px] object-contain" />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold mb-3">Select your answer:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map(idx => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      className="h-14 text-lg"
                      onClick={() => handleAnswer(activeQuestion, idx)}
                    >
                      Option {idx + 1}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">Once submitted, answers cannot be changed.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ users, isAdmin, onDeleteUser }) {
  const sortedUsers = useMemo(() => {
    return Object.values(users)
      .filter(u => u.role === 'student')
      .map(u => {
        const answers = Object.values(u.progress?.answers || {});
        const correct = answers.filter(a => a.isCorrect).length;
        const totalAnswered = answers.length;
        const wrong = totalAnswered - correct;
        const points = correct * 10; // 10 points per correct answer
        return { ...u, correct, wrong, totalAnswered, points };
      })
      .sort((a, b) => b.points - a.points);
  }, [users]);

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-muted/30">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="text-yellow-500" /> Leaderboard</h2>
        <p className="text-muted-foreground mt-1">Top students by points (10 pts per correct answer).</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="p-4 font-semibold text-sm">Rank</th>
              <th className="p-4 font-semibold text-sm">Student</th>
              <th className="p-4 font-semibold text-sm">Points</th>
              <th className="p-4 font-semibold text-sm">Correct</th>
              <th className="p-4 font-semibold text-sm">Wrong</th>
              <th className="p-4 font-semibold text-sm">Progress</th>
              {isAdmin && <th className="p-4 font-semibold text-sm text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-muted-foreground">No students have answered any questions yet.</td>
              </tr>
            ) : (
              sortedUsers.map((u, idx) => (
                <tr key={u.normalizedUsername} className="border-b hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-medium">
                    {idx === 0 ? <span className="text-yellow-500 text-lg">🥇</span> : 
                     idx === 1 ? <span className="text-gray-400 text-lg">🥈</span> : 
                     idx === 2 ? <span className="text-amber-600 text-lg">🥉</span> : 
                     `#${idx + 1}`}
                  </td>
                  <td className="p-4 font-medium">{u.username}</td>
                  <td className="p-4 font-bold text-primary">{u.points}</td>
                  <td className="p-4 text-green-600 font-medium">{u.correct}</td>
                  <td className="p-4 text-red-500 font-medium">{u.wrong}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(u.totalAnswered/496)*100}%` }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{u.totalAnswered}/496</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteUser && onDeleteUser(u.username)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
