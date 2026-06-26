'use client';

import { useState, useEffect } from 'react';
import {
  Utensils, Leaf, ArrowRight, Check, AlertTriangle, IndianRupee,
  Sparkles, Clock, BookOpen, Save, ChevronRight, Search, X, ShieldCheck,
  Apple, Wheat, Droplets, Flame, Star, History, ChefHat
} from 'lucide-react';

const ingredientSuggestions = [
  'Quinoa', 'Avocado', 'Chia Seeds', 'Almond Milk', 'Tofu',
  'Kale', 'Blueberries', 'Greek Yogurt', 'Salmon', 'Olive Oil',
  'Sweet Potato', 'Broccoli', 'Oats', 'Flaxseed', 'Spinach'
];

const substitutionResults = [
  {
    id: 1,
    original: 'Quinoa',
    substitute: 'Broken Wheat (Dalia)',
    emoji: '🌾',
    nutrients: [
      { name: 'Protein', original: 14, substitute: 12, unit: 'g', status: 'good' },
      { name: 'Fiber', original: 7, substitute: 5, unit: 'g', status: 'good' },
      { name: 'Iron', original: 4.6, substitute: 3.9, unit: 'mg', status: 'good' },
    ],
    costOriginal: '₹800/kg',
    costSubstitute: '₹60/kg',
    savings: '92%',
    availability: 'Available in every kirana store',
    safety: null,
    medicalSafe: true,
  },
  {
    id: 2,
    original: 'Avocado',
    substitute: 'Mashed Banana + Flaxseed',
    emoji: '🍌',
    nutrients: [
      { name: 'Healthy Fats', original: 15, substitute: 13, unit: 'g', status: 'good' },
      { name: 'Potassium', original: 485, substitute: 422, unit: 'mg', status: 'good' },
      { name: 'Vitamin E', original: 2.1, substitute: 1.5, unit: 'mg', status: 'warn' },
    ],
    costOriginal: '₹250/pc',
    costSubstitute: '₹5 + ₹40',
    savings: '82%',
    availability: 'Widely available across India',
    safety: null,
    medicalSafe: true,
  },
  {
    id: 3,
    original: 'Chia Seeds',
    substitute: 'Sabja (Basil Seeds)',
    emoji: '🫘',
    nutrients: [
      { name: 'Omega-3', original: 5, substitute: 2.5, unit: 'g', status: 'warn' },
      { name: 'Fiber', original: 10, substitute: 7, unit: 'g', status: 'good' },
      { name: 'Calcium', original: 179, substitute: 154, unit: 'mg', status: 'good' },
    ],
    costOriginal: '₹1,500/kg',
    costSubstitute: '₹200/kg',
    savings: '87%',
    availability: 'Available in local markets & online',
    safety: 'Omega-3 content is lower — consider supplementing with walnuts',
    medicalSafe: true,
  },
];

const recipeSteps = [
  'Soak 1 cup Dalia in water for 30 minutes, then cook until fluffy',
  'Mash 1 ripe banana and mix with 1 tbsp ground flaxseed',
  'Add 2 tbsp soaked Sabja seeds to the dressing',
  'Dice cucumber, tomatoes, and green bell pepper',
  'Toss cooked Dalia with vegetables',
  'Drizzle the banana-flaxseed dressing and mix gently',
  'Garnish with fresh coriander and a squeeze of lemon',
];

const totalNutrition = {
  calories: 385,
  protein: '18g',
  carbs: '52g',
  fats: '14g',
  fiber: '12g',
};

const mealPlanHistory = [
  { id: 1, name: 'Week 28 – Gestational Diabetes Plan', date: '20 Jun 2026', items: 7 },
  { id: 2, name: 'Iron-Rich Pregnancy Diet', date: '14 Jun 2026', items: 5 },
  { id: 3, name: 'Post-Scan Recovery Meal Plan', date: '08 Jun 2026', items: 4 },
];

function NutritionBar({ name, original, substitute, unit, status }) {
  const max = Math.max(original, substitute) * 1.2;
  const origPct = (original / max) * 100;
  const subPct = (substitute / max) * 100;
  const barColor = status === 'good' ? '#00b894' : status === 'warn' ? '#feca57' : '#ff6b6b';
  const icon = status === 'good' ? '✅' : '⚠️';

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{name}</span>
        <span style={{ fontSize: '0.8rem' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${origPct}%`, background: 'var(--accent-primary)', borderRadius: 99, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{original}{unit}</span>
        </div>
        <ArrowRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${subPct}%`, background: barColor, borderRadius: 99, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{substitute}{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function DietPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('paste');
  const [dietText, setDietText] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [saved, setSaved] = useState(false);

  // Constraint chips state
  const [budget, setBudget] = useState('Low');
  const [dietary, setDietary] = useState('Vegetarian');
  const [region, setRegion] = useState('North Indian');
  const [allergies] = useState(['Peanuts', 'Shellfish']);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredSuggestions = ingredientSuggestions.filter(s =>
    s.toLowerCase().includes(quickSearch.toLowerCase())
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="skeleton skeleton-text" style={{ width: 200, height: 28 }} />
          <div className="skeleton skeleton-text" style={{ width: 320, height: 16, marginTop: 8 }} />
        </div>
        <div className="skeleton skeleton-card" style={{ height: 120, marginBottom: 24 }} />
        <div className="skeleton skeleton-card" style={{ height: 60, marginBottom: 24 }} />
        <div className="grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 280 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Page Header */}
          <div className="page-header animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #00b894, #00cec9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Utensils size={24} color="white" />
              </div>
              <div>
                <h1>Diet Planner</h1>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-secondary)' }} />
                  AI-powered ingredient substitution
                </p>
              </div>
            </div>
          </div>

          {/* Input Mode Tabs */}
          <div className="glass-card-static animate-fade-in" style={{ marginBottom: 24, animationDelay: '0.1s' }}>
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button
                className={`tab ${activeTab === 'paste' ? 'active' : ''}`}
                onClick={() => setActiveTab('paste')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} /> Paste Diet Plan
                </span>
              </button>
              <button
                className={`tab ${activeTab === 'quick' ? 'active' : ''}`}
                onClick={() => setActiveTab('quick')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Search size={14} /> Quick Substitute
                </span>
              </button>
            </div>

            {activeTab === 'paste' ? (
              <textarea
                className="textarea"
                placeholder="Paste your diet plan here... e.g.&#10;Breakfast: Quinoa bowl with avocado&#10;Lunch: Chia seed pudding with fruits&#10;Dinner: Grilled tofu with kale salad"
                value={dietText}
                onChange={(e) => setDietText(e.target.value)}
                style={{ minHeight: 120 }}
              />
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 40 }}
                    placeholder="Type an ingredient to find substitutes..."
                    value={quickSearch}
                    onChange={(e) => { setQuickSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {quickSearch && (
                    <button
                      onClick={() => setQuickSearch('')}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {showSuggestions && quickSearch && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 10,
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {filteredSuggestions.slice(0, 5).map(s => (
                      <button
                        key={s}
                        onClick={() => { setQuickSearch(s); setShowSuggestions(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '10px 16px', border: 'none',
                          background: 'transparent', color: 'var(--text-primary)',
                          cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem',
                          transition: 'background 0.2s ease',
                          fontFamily: 'var(--font-body)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Apple size={14} style={{ color: 'var(--accent-secondary)' }} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Constraint Chips */}
          <div className="glass-card-static animate-fade-in" style={{ marginBottom: 24, animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {/* Budget */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Budget:</span>
              {['Low', 'Med', 'High'].map(b => (
                <button key={b} className={`chip ${budget === b ? 'active' : ''}`} onClick={() => setBudget(b)}>
                  <IndianRupee size={12} /> {b}
                </button>
              ))}

              <div style={{ width: 1, height: 24, background: 'var(--border-glass)', margin: '0 4px' }} />

              {/* Dietary */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Diet:</span>
              {['Vegetarian', 'Vegan', 'Jain'].map(d => (
                <button key={d} className={`chip ${dietary === d ? 'active' : ''}`} onClick={() => setDietary(d)}>
                  <Leaf size={12} /> {d}
                </button>
              ))}

              <div style={{ width: 1, height: 24, background: 'var(--border-glass)', margin: '0 4px' }} />

              {/* Region */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Region:</span>
              {['North Indian', 'South Indian', 'Bengali', 'Gujarati'].map(r => (
                <button key={r} className={`chip ${region === r ? 'active' : ''}`} onClick={() => setRegion(r)}>
                  {r}
                </button>
              ))}

              <div style={{ width: 1, height: 24, background: 'var(--border-glass)', margin: '0 4px' }} />

              {/* Allergies */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Allergies:</span>
              {allergies.map(a => (
                <span key={a} className="chip active" style={{ background: 'rgba(255,107,107,0.12)', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', cursor: 'default' }}>
                  <AlertTriangle size={12} /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginBottom: 32, animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.2s', opacity: 0 }}>
            <button className="btn btn-primary btn-lg" onClick={() => setShowResults(true)}>
              <Sparkles size={18} /> Find Substitutions
            </button>
          </div>

          {/* Results */}
          {showResults && (
            <>
              <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>✦</span>
                Substitution Results
              </h2>

              <div className="grid-3 stagger-children" style={{ marginBottom: 32 }}>
                {substitutionResults.map((item) => (
                  <div key={item.id} className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Glow accent */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: 'linear-gradient(90deg, #00b894, #00cec9)',
                      borderRadius: '16px 16px 0 0'
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 4 }}>
                      <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.original}</span>
                          <ArrowRight size={14} style={{ color: 'var(--accent-secondary)' }} />
                          <span style={{ fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '0.95rem' }}>{item.substitute}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nutrition Bars */}
                    <div style={{ marginBottom: 16 }}>
                      {item.nutrients.map(n => (
                        <NutritionBar key={n.name} {...n} />
                      ))}
                    </div>

                    {/* Cost Comparison */}
                    <div style={{
                      background: 'rgba(0,184,148,0.08)', borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px', marginBottom: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.costOriginal}</span>
                          {' → '}
                          <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{item.costSubstitute}</span>
                        </span>
                        <span className="badge badge-success">💰 {item.savings} saved</span>
                      </div>
                    </div>

                    {/* Availability */}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} style={{ color: 'var(--accent-success)' }} />
                      {item.availability}
                    </p>

                    {/* Safety Warning */}
                    {item.safety && (
                      <div style={{
                        background: 'rgba(254,202,87,0.08)', border: '1px solid rgba(254,202,87,0.2)',
                        borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                        fontSize: '0.8rem', color: 'var(--accent-warning)',
                        display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        {item.safety}
                      </div>
                    )}

                    {/* Medical Safety */}
                    {item.medicalSafe && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--accent-success)' }}>
                        <ShieldCheck size={14} />
                        <span>Medically safe for pregnancy</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Modified Recipe */}
              <div className="glass-card-static animate-fade-in" style={{ marginBottom: 24, animationDelay: '0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <ChefHat size={20} color="white" />
                  </div>
                  <div>
                    <h3>Dalia Salad with Banana-Flaxseed Dressing</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Modified recipe using affordable Indian substitutes</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24 }}>
                  {/* Steps */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Steps
                    </h4>
                    <ol style={{ paddingLeft: 20 }}>
                      {recipeSteps.map((step, i) => (
                        <li key={i} style={{
                          fontSize: '0.9rem', color: 'var(--text-primary)',
                          marginBottom: 10, lineHeight: 1.5,
                          paddingLeft: 4,
                        }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Nutrition Summary */}
                  <div style={{
                    width: 200, flexShrink: 0, background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)', padding: 20
                  }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Nutrition
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { label: 'Calories', value: totalNutrition.calories, icon: <Flame size={14} />, color: '#ff6b6b' },
                        { label: 'Protein', value: totalNutrition.protein, icon: <Wheat size={14} />, color: '#6c5ce7' },
                        { label: 'Carbs', value: totalNutrition.carbs, icon: <Apple size={14} />, color: '#feca57' },
                        { label: 'Fats', value: totalNutrition.fats, icon: <Droplets size={14} />, color: '#00cec9' },
                        { label: 'Fiber', value: totalNutrition.fiber, icon: <Leaf size={14} />, color: '#00b894' },
                      ].map(n => (
                        <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: n.color }}>{n.icon}</span> {n.label}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{n.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ marginBottom: 32 }}>
                <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 200 }}>
                  {saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save to Meal Plans</>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar - Meal Plan History */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div className="glass-card-static animate-fade-in" style={{ position: 'sticky', top: 100, animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <History size={18} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '1rem' }}>Meal Plan History</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mealPlanHistory.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    padding: '14px 12px', background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    transition: 'all 0.3s ease', border: '1px solid transparent',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'rgba(108,92,231,0.08)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {plan.date}
                    </span>
                    <span className="badge badge-primary">{plan.items} items</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline" style={{ width: '100%', marginTop: 16, justifyContent: 'center', fontSize: '0.85rem' }}>
              View All Plans <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
