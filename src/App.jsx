import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, CalendarDays, Check, CheckCheck, CircleHelp, Clock3, ListTodo, LogOut, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { api } from './api.js';

const today = new Date().toISOString().slice(0, 10);
const blankTask = { title: '', description: '', dueDate: today, priority: 'medium' };
const prettyDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { onAuth(await api[mode === 'login' ? 'login' : 'register'](fields)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-page">
    <div className="auth-decoration"><span className="orb orb-one"/><span className="orb orb-two"/></div>
    <section className="auth-card">
      <a className="brand" href="#top"><span className="brand-mark"><ListTodo size={20}/></span>daymark</a>
      <p className="eyebrow">A LITTLE MORE FOCUS</p>
      <h1>{mode === 'login' ? 'Welcome back.' : 'Make room for what matters.'}</h1>
      <p className="auth-subtitle">{mode === 'login' ? 'Sign in and pick up where you left off.' : 'Create an account and get your tasks in order.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Your name<input autoComplete="name" placeholder="Alex Morgan" value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} required /></label>}
        <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={fields.email} onChange={e => setFields({ ...fields, email: e.target.value })} required /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" minLength="8" value={fields.password} onChange={e => setFields({ ...fields, password: e.target.value })} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}<span>→</span></button>
      </form>
      <p className="auth-switch">{mode === 'login' ? 'New to Daymark?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    </section>
    <p className="auth-footnote"><Sparkles size={14}/> Small steps add up.</p>
  </main>;
}

function TaskDialog({ task, onClose, onSave }) {
  const [fields, setFields] = useState(task ? { title: task.title, description: task.description, dueDate: task.dueDate, priority: task.priority } : blankTask);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    try { await onSave(fields, task?.id); onClose(); } catch (err) { setError(err.message); }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-heading"><div><p className="eyebrow">YOUR NEXT STEP</p><h2 id="dialog-title">{task ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={submit} className="task-form">
        <label>Task name<input autoFocus maxLength="120" placeholder="What needs to get done?" value={fields.title} onChange={e => setFields({ ...fields, title: e.target.value })} required /></label>
        <label>Notes <span className="optional">Optional</span><textarea rows="3" maxLength="500" placeholder="Add a little context…" value={fields.description} onChange={e => setFields({ ...fields, description: e.target.value })}/></label>
        <div className="field-row"><label>Due date<input type="date" value={fields.dueDate} onChange={e => setFields({ ...fields, dueDate: e.target.value })} required /></label><label>Priority<select value={fields.priority} onChange={e => setFields({ ...fields, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary">{task ? 'Save changes' : 'Add task'}</button></div>
      </form>
    </section>
  </div>;
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const late = !task.completed && task.dueDate < today;
  return <article className={`task-card ${task.completed ? 'is-complete' : ''}`}>
    <button className={`check-button ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed && <Check size={16}/>}</button>
    <button className="task-copy" onClick={() => onEdit(task)}><span className="task-title">{task.title}</span>{task.description && <span className="task-description">{task.description}</span>}<span className="task-meta"><span className={`priority-dot ${task.priority}`}/>{task.priority} priority <span className="meta-divider">·</span><CalendarDays size={13}/><span className={late ? 'overdue' : ''}>{prettyDate.format(new Date(`${task.dueDate}T12:00:00`))}{late ? ' · overdue' : ''}</span></span></button>
    <button className="icon-button delete-button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}><Trash2 size={16}/></button>
  </article>;
}

function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('daymark-session')); } catch { return null; } });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState(undefined);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const refresh = useCallback(async () => {
    if (!session?.token) { setLoading(false); return; }
    try { setTasks(await api.listTasks(session.token)); setError(''); }
    catch (err) { setError(err.message); if (err.message.includes('session')) signOut(); }
    finally { setLoading(false); }
  }, [session]);
  useEffect(() => { refresh(); }, [refresh]);
  function signIn(data) { localStorage.setItem('daymark-session', JSON.stringify(data)); setSession(data); }
  function signOut() { localStorage.removeItem('daymark-session'); setSession(null); setTasks([]); }
  async function saveTask(values, id) {
    if (id) await api.updateTask(session.token, id, values);
    else await api.createTask(session.token, values);
    await refresh();
  }
  async function toggleTask(task) { await api.updateTask(session.token, task.id, { completed: !task.completed }); await refresh(); }
  async function deleteTask(task) { if (!window.confirm(`Delete “${task.title}”?`)) return; await api.deleteTask(session.token, task.id); await refresh(); }

  const active = tasks.filter(task => !task.completed).length;
  const done = tasks.length - active;
  const filteredTasks = useMemo(() => tasks.filter(task => {
    const matches = `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase());
    if (!matches) return false;
    if (filter === 'open') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  }), [tasks, filter, query]);
  if (!session?.token) return <AuthScreen onAuth={signIn}/>;

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#top"><span className="brand-mark"><ListTodo size={20}/></span>daymark</a><div className="side-label">WORKSPACE</div><button className="nav-item selected"><ListTodo size={17}/> My tasks <span>{active}</span></button><div className="sidebar-note"><span className="note-icon"><CircleHelp size={16}/></span><div><strong>A gentle reminder</strong><p>You don’t have to do it all today. Just take the next step.</p></div></div><div className="sidebar-bottom"><div className="avatar">{session.user.name.slice(0, 1).toUpperCase()}</div><div className="user-info"><strong>{session.user.name}</strong><span>{session.user.email}</span></div><button className="icon-button signout" title="Sign out" onClick={signOut}><LogOut size={16}/></button></div></aside>
    <main className="main-area"><header className="topbar"><div><span className="topbar-label">YOUR PERSONAL WORKSPACE</span><span className="online-status"><i/> All changes saved</span></div><button className="button button-primary add-top" onClick={() => setModalTask(null)}><Plus size={17}/> New task</button></header>
      <div className="content"><section className="welcome-row"><div><p className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</p><h1>A little progress <span>goes a long way.</span></h1><p className="welcome-sub">Keep your focus on what matters today.</p></div><div className="welcome-decoration"><span className="sun">✳</span><span className="sun-ray"/></div></section>
      <section className="stats-grid"><article className="stat-card"><span className="stat-icon lavender"><ListTodo size={18}/></span><div><span className="stat-label">IN YOUR LIST</span><strong>{tasks.length}</strong><span className="stat-caption">{tasks.length === 1 ? 'task in total' : 'tasks in total'}</span></div></article><article className="stat-card"><span className="stat-icon peach"><Clock3 size={18}/></span><div><span className="stat-label">UP NEXT</span><strong>{active}</strong><span className="stat-caption">still to take on</span></div></article><article className="stat-card"><span className="stat-icon mint"><CheckCheck size={18}/></span><div><span className="stat-label">DONE & DUSTED</span><strong>{done}</strong><span className="stat-caption">{done ? 'look at you go!' : 'your wins will show up here'}</span></div></article></section>
      <section className="tasks-section"><div className="section-heading"><div><p className="eyebrow">MAKE IT HAPPEN</p><h2>Your tasks <span className="count-pill">{filteredTasks.length}</span></h2></div><button className="button button-outline add-inline" onClick={() => setModalTask(null)}><Plus size={16}/> Add task</button></div>
        <div className="toolbar"><div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All <span>{tasks.length}</span></button><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>To do <span>{active}</span></button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed <span>{done}</span></button></div><label className="search-box"><Search size={16}/><input placeholder="Find a task…" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
        {error && <div className="error-banner" role="alert">{error}<button onClick={refresh}>Try again</button></div>}
        <div className="task-list">{loading ? <div className="empty-state"><div className="loading-mark"><ArrowDownWideNarrow size={20}/></div><strong>Getting your list ready…</strong></div> : filteredTasks.length ? filteredTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={setModalTask} onDelete={deleteTask}/>) : <div className="empty-state"><div className="empty-icon">{query ? <Search size={20}/> : <Sparkles size={20}/>}</div><strong>{query ? 'No tasks found' : filter === 'completed' ? 'No completed tasks yet' : 'Your list has room to grow'}</strong><p>{query ? 'Try another search.' : filter === 'completed' ? 'Finished tasks will show up here.' : 'Add one small thing you would like to get done.'}</p>{!query && filter !== 'completed' && <button className="button button-primary" onClick={() => setModalTask(null)}><Plus size={16}/> Create your first task</button>}</div>}</div>
        <p className="list-footer"><span>Showing {filteredTasks.length} of {tasks.length} tasks</span><span><span className="footer-sparkle">✳</span> One thing at a time.</span></p>
      </section><footer className="page-footer">Made for the everyday things that move you forward.</footer></div>
    </main>
    {modalTask !== undefined && <TaskDialog key={modalTask?.id || 'new'} task={modalTask} onClose={() => setModalTask(undefined)} onSave={saveTask}/>}
  </div>;
}

export default App;
