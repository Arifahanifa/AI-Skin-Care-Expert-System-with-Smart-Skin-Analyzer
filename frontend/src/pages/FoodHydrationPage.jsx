import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Droplet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Apple,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function FoodHydrationPage() {
  const [foodPlanData, setFoodPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hydration state
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [targetGlasses, setTargetGlasses] = useState(10);
  const [loggingWater, setLoggingWater] = useState(false);

  // Meal diary logging form state
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealForm, setMealForm] = useState({
    meal_type: 'breakfast',
    food_items: '',
    tags: 'Indian, Balanced',
    symptom_observation: ''
  });
  const [submittingMeal, setSubmittingMeal] = useState(false);

  const fetchPlanAndDiary = async () => {
    setLoading(true);
    try {
      const res = await api.food.getPlan();
      setFoodPlanData(res);
      setWaterGlasses(res.today_hydration?.glasses || 0);
      setTargetGlasses(res.plan?.hydration_target?.target_glasses || 10);
    } catch (err) {
      setError(err.message || 'Failed to load food and hydration habits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanAndDiary();
  }, []);

  const handleAddGlass = async () => {
    const newCount = waterGlasses + 1;
    const newAmount = newCount * 250;
    setWaterGlasses(newCount);
    setLoggingWater(true);
    try {
      await api.hydration.log({
        glasses: newCount,
        amount_ml: newAmount
      });
    } catch (err) {
      console.error('Error logging water:', err);
    } finally {
      setLoggingWater(false);
    }
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!mealForm.food_items.trim()) {
      alert('Please enter food items.');
      return;
    }
    setSubmittingMeal(true);
    try {
      await api.food.logMeal(mealForm);
      setShowMealModal(false);
      setMealForm({ meal_type: 'breakfast', food_items: '', tags: 'Indian, Balanced', symptom_observation: '' });
      await fetchPlanAndDiary();
    } catch (err) {
      alert('Error saving meal: ' + err.message);
    } finally {
      setSubmittingMeal(false);
    }
  };

  const plan = foodPlanData?.plan || {};
  const meals = plan.meals || [];
  const todayEntries = foodPlanData?.today_food_entries || [];

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14241B' }}>
            Food & Water Habits
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#536258', marginTop: '0.25rem' }}>
            Balanced meal suggestions and daily water tracking to support comfortable skin from the inside.
          </p>
        </div>

        <button
          onClick={() => setShowMealModal(true)}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>Log Meal in Diary</span>
        </button>
      </div>

      {/* Everyday Wellness Note */}
      <div style={{ padding: '0.85rem 1.15rem', borderRadius: '12px', backgroundColor: '#FAF8F5', border: '1px solid #E8E2D8', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <Info size={18} color="#2D6A4F" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.8125rem', color: '#536258', lineHeight: 1.5 }}>
          <strong>Wellness Note:</strong> Balanced food and regular water intake support natural skin comfort and digestion. Food alone does not replace medical treatment. We suggest wholesome meals without restrictive diets.
        </span>
      </div>

      {/* Hydration Tracker Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Droplet size={20} color="#2D6A4F" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14241B' }}>
                Daily Water Tracker
              </h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#536258', marginTop: '0.25rem' }}>
              Target: {targetGlasses} glasses (~2,500 ml) spread throughout the day.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2D6A4F' }}>
                {waterGlasses} / {targetGlasses}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#79877E' }}>
                {waterGlasses * 250} ml logged today
              </div>
            </div>

            <button
              onClick={handleAddGlass}
              disabled={loggingWater}
              className="btn btn-secondary"
            >
              <Plus size={16} />
              <span>+1 Glass (250ml)</span>
            </button>
          </div>
        </div>

        {/* Visual Glass Tracker Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${targetGlasses}, 1fr)`, gap: '0.45rem' }}>
          {Array.from({ length: targetGlasses }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => {
                const newC = idx + 1;
                setWaterGlasses(newC);
                api.hydration.log({ glasses: newC, amount_ml: newC * 250 });
              }}
              style={{
                height: 38,
                borderRadius: '8px',
                backgroundColor: idx < waterGlasses ? '#2D6A4F' : '#FAF8F5',
                border: idx < waterGlasses ? '1px solid #1E4A37' : '1px solid #E8E2D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              title={`Glass ${idx + 1}`}
            >
              <Droplet size={15} color={idx < waterGlasses ? '#FFFFFF' : '#9CA8A1'} />
            </div>
          ))}
        </div>
      </div>

      {/* Balanced Meal Suggestions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14241B' }}>
          Balanced Everyday Meal Ideas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {meals.map((m) => (
            <div
              key={m.meal_type}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#2D6A4F', backgroundColor: '#E8F5EE', padding: '2px 8px', borderRadius: '6px' }}>
                  {m.meal_type}
                </span>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14241B' }}>
                  {m.title}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {m.suggestions?.map((item, i) => (
                  <div key={i} style={{ padding: '0.65rem', backgroundColor: '#FAF8F5', borderRadius: '8px', border: '1px solid #E8E2D8' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#14241B' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {item.tags?.map((t, ti) => (
                        <span key={ti} style={{ fontSize: '0.65rem', color: '#2D6A4F', backgroundColor: '#E8F5EE', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Food Diary Entries */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14241B' }}>
            Today's Logged Meals
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#79877E' }}>
            {todayEntries.length} logged today
          </span>
        </div>

        {todayEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayEntries.map((e) => (
              <div key={e.id} style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#FAF8F5', border: '1px solid #E8E2D8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#2D6A4F', backgroundColor: '#E8F5EE', padding: '1px 6px', borderRadius: '4px' }}>
                      {e.meal_type}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#14241B' }}>
                      {e.food_items}
                    </span>
                  </div>
                  {e.dietary_tags && (
                    <div style={{ fontSize: '0.75rem', color: '#536258', marginTop: '0.25rem' }}>
                      {e.dietary_tags}
                    </div>
                  )}
                  {e.symptom_observation && (
                    <div style={{ fontSize: '0.75rem', color: '#D9734E', marginTop: '0.25rem' }}>
                      Observation: {e.symptom_observation}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#79877E' }}>
                  {e.created_at?.split(' ')[1]?.slice(0, 5) || ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#79877E', backgroundColor: '#FAF8F5', borderRadius: '10px' }}>
            No meals logged yet today. Use the "Log Meal in Diary" button above.
          </div>
        )}
      </div>

      {/* Log Meal Modal */}
      {showMealModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 36, 27, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14241B' }}>
                Log Meal in Food Diary
              </h3>
              <button onClick={() => setShowMealModal(false)} style={{ background: 'none', border: 'none', color: '#79877E', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Meal Time</label>
                <select
                  value={mealForm.meal_type}
                  onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem' }}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snack">Snack</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label className="form-label">Food & Beverage Items Consumed</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Idlis, Sambar, Coconut chutney, Water"
                  value={mealForm.food_items}
                  onChange={(e) => setMealForm({ ...mealForm, food_items: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Dietary Tags (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, High Protein, Balanced"
                  value={mealForm.tags}
                  onChange={(e) => setMealForm({ ...mealForm, tags: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Personal Observation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Felt comfortable, skin was fine"
                  value={mealForm.symptom_observation}
                  onChange={(e) => setMealForm({ ...mealForm, symptom_observation: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMeal}
                  className="btn btn-primary btn-sm"
                >
                  {submittingMeal ? 'Saving...' : 'Save Meal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
