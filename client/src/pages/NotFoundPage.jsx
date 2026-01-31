import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="btn btn-primary flex items-center gap-2"
      >
        <FaHome /> Go to Home
      </Link>
    </div>
  );
};

export default NotFoundPage; 