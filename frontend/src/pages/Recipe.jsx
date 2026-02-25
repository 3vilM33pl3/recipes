import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RecipeView from '../components/RecipeView';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRecipe, deleteRecipe } from '../api/recipes';

function Recipe() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [slug]);

  const loadRecipe = async () => {
    try {
      const data = await getRecipe(slug);
      if (data.success && data.recipe) {
        setRecipe(data.recipe);
      } else {
        setError('Recipe not found');
      }
    } catch (err) {
      console.error('Failed to load recipe:', err);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteRecipe(slug);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('Failed to delete recipe');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownloadQR = () => {
    if (recipe?.qrCodeImage) {
      const link = document.createElement('a');
      link.href = `/qrcodes/${recipe.qrCodeImage}`;
      link.download = `${recipe.slug}-qr.png`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading recipe..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-fire-500">
            🍳 Recipes
          </Link>
          <div className="flex gap-2">
            <Link to="/" className="btn-secondary text-sm">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {recipe && <RecipeView recipe={recipe} />}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button onClick={handleCopyLink} className="btn-secondary">
            📋 Copy Link
          </button>
          {recipe?.qrCodeImage && (
            <button onClick={handleDownloadQR} className="btn-secondary">
              📥 Download QR
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete Recipe'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Recipe;
