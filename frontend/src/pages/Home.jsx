import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadRecipe, getRecipes } from '../api/recipes';

function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await getRecipes();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const result = await uploadRecipe(file);
      if (result.success && result.recipe) {
        navigate(`/r/${result.recipe.slug}`);
      } else {
        setError('Failed to process recipe. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload recipe. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🍳 Recipes
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload section */}
        <section className="mb-12">
          <UploadForm onUpload={handleUpload} isLoading={uploading} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}
        </section>

        {/* Recent recipes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Recipes
          </h2>

          {loading ? (
            <LoadingSpinner message="Loading recipes..." />
          ) : recipes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📷</p>
              <p>No recipes yet. Upload your first recipe photo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-gray-500 text-sm">
        <p>Recipes - Convert recipe photos to shareable pages</p>
      </footer>
    </div>
  );
}

export default Home;
