import { useEffect, useState } from 'react';

function recipeToForm(recipe) {
  return {
    title: recipe.title || '',
    description: recipe.description || '',
    servings: recipe.servings || '',
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    difficulty: recipe.difficulty || '',
    ingredients: (recipe.ingredients || []).join('\n'),
    instructions: (recipe.instructions || []).join('\n'),
    nutrition: recipe.nutrition || '',
    notes: recipe.notes || '',
  };
}

function splitLines(value) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
      {children}
    </label>
  );
}

function RecipeView({ recipe, onSave, isSaving, saveError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => recipeToForm(recipe));

  useEffect(() => {
    setForm(recipeToForm(recipe));
  }, [recipe]);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleCancel = () => {
    setForm(recipeToForm(recipe));
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      servings: form.servings,
      prepTime: form.prepTime,
      cookTime: form.cookTime,
      difficulty: form.difficulty,
      ingredients: splitLines(form.ingredients),
      instructions: splitLines(form.instructions),
      nutrition: form.nutrition,
      notes: form.notes,
    };

    const success = await onSave(payload);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="card">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🍖 {recipe.title || 'Untitled Recipe'}
            </h1>
            {recipe.description && (
              <p className="text-gray-600 mt-2">{recipe.description}</p>
            )}
            {(recipe.servings || recipe.prepTime || recipe.cookTime || recipe.difficulty) && (
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
                {recipe.servings && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">Servings: {recipe.servings}</span>
                )}
                {recipe.prepTime && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">Prep: {recipe.prepTime}</span>
                )}
                {recipe.cookTime && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">Cook: {recipe.cookTime}</span>
                )}
                {recipe.difficulty && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">Difficulty: {recipe.difficulty}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-sm whitespace-nowrap"
              disabled={isEditing}
            >
              ✏️ Edit Recipe
            </button>
            {recipe.qrCodeImage && (
              <div className="flex-shrink-0">
                <img
                  src={`/qrcodes/${recipe.qrCodeImage}`}
                  alt="QR Code"
                  className="w-24 h-24"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 border-b">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Recipe title"
                disabled={isSaving}
              />
            </Field>
            <Field label="Servings">
              <input
                type="text"
                value={form.servings}
                onChange={(event) => updateField('servings', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g. 4"
                disabled={isSaving}
              />
            </Field>
            <Field label="Prep Time">
              <input
                type="text"
                value={form.prepTime}
                onChange={(event) => updateField('prepTime', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g. 20 mins"
                disabled={isSaving}
              />
            </Field>
            <Field label="Cook Time">
              <input
                type="text"
                value={form.cookTime}
                onChange={(event) => updateField('cookTime', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g. 35 mins"
                disabled={isSaving}
              />
            </Field>
            <Field label="Difficulty">
              <input
                type="text"
                value={form.difficulty}
                onChange={(event) => updateField('difficulty', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g. Easy"
                disabled={isSaving}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[6rem]"
              placeholder="Short description"
              disabled={isSaving}
            />
          </Field>

          <Field label="Ingredients (one per line)">
            <textarea
              value={form.ingredients}
              onChange={(event) => updateField('ingredients', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[10rem]"
              placeholder={'1 cup flour\n2 eggs'}
              disabled={isSaving}
            />
          </Field>

          <Field label="Instructions (one step per line)">
            <textarea
              value={form.instructions}
              onChange={(event) => updateField('instructions', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[10rem]"
              placeholder={'Mix ingredients\nBake for 20 minutes'}
              disabled={isSaving}
            />
          </Field>

          <Field label="Nutrition">
            <textarea
              value={form.nutrition}
              onChange={(event) => updateField('nutrition', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[6rem]"
              placeholder="Optional nutrition details"
              disabled={isSaving}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[6rem]"
              placeholder="Optional notes"
              disabled={isSaving}
            />
          </Field>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary" disabled={isSaving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">INGREDIENTS</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-fire-500 mr-2">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">INSTRUCTIONS</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-fire-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {recipe.nutrition && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">NUTRITION</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{recipe.nutrition}</p>
            </div>
          )}

          {recipe.notes && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">NOTES</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{recipe.notes}</p>
            </div>
          )}
        </>
      )}

      {recipe.extractedRaw && (
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">ORIGINAL EXTRACTION</h2>
          <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 rounded-lg p-4 overflow-x-auto">
            {recipe.extractedRaw}
          </pre>
        </div>
      )}

      {recipe.originalImage && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">ORIGINAL IMAGE</h2>
          <img
            src={`/uploads/${recipe.originalImage}`}
            alt="Original recipe"
            className="max-w-full rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  );
}

export default RecipeView;
