function RecipeView({ recipe }) {
  return (
    <div className="card">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🍖 {recipe.title || 'Untitled Recipe'}
            </h1>
            {recipe.description && (
              <p className="text-gray-600 mt-2">{recipe.description}</p>
            )}
          </div>
          {recipe.qrCodeImage && (
            <div className="ml-4 flex-shrink-0">
              <img
                src={`/qrcodes/${recipe.qrCodeImage}`}
                alt="QR Code"
                className="w-24 h-24"
              />
            </div>
          )}
        </div>
      </div>

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

      {/* Show raw text if no structured content */}
      {(!recipe.ingredients || recipe.ingredients.length === 0) &&
       (!recipe.instructions || recipe.instructions.length === 0) &&
       recipe.extractedRaw && (
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">RECIPE TEXT</h2>
          <pre className="whitespace-pre-wrap text-gray-700 font-sans">
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
