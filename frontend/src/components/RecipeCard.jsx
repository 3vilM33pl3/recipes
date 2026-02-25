import { Link } from 'react-router-dom';

function RecipeCard({ recipe }) {
  return (
    <Link to={`/r/${recipe.slug}`} className="card block hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {recipe.thumbnailImage ? (
          <img
            src={`/thumbnails/${recipe.thumbnailImage}`}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍖
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {recipe.title || 'Untitled Recipe'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(recipe.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}

export default RecipeCard;
